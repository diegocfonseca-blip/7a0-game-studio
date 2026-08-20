#!/usr/bin/env node
// ─── 📱 STORIES: o campinho novo (1080×1920, formato de story) ──────────────
//
// Mesma arte do mockup do campinho (`scripts/rosto/mockup-campinho.mjs`), mas
// no formato VERTICAL de story, que é como o Diego posta. Pedido dele (20/08):
// *"me mande o mockup q vc fez p stories do campinho mas sem dizer nada de
// fonte oswald e de rostos"*. Então, sem exceção, nesta folha:
//   ❌ nada de nome de fonte na tela (isso é papo de programador, não de jogo)
//   ❌ nada de foto/rosto de jogador — o jogo NÃO tem rosto, e o Diego não quer
//      prometer o que não existe (regra dele: não inventar como a pessoa é)
//   ✅ o campinho exatamente como está no ar: boneco solto, manto do dono,
//      vaga vazia tracejada
//
// Mora no repo (e não no scratchpad) pelo mesmo motivo dos outros mockups:
// folha feita à mão se perde, e aí o próximo post teria que ser redesenhado.
//
//   node scripts/mockup-campinho-stories.mjs --saida /tmp/campinho-stories.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'campinho-stories.png')

const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

// manto de exemplo: preto e dourado (o do Futpoint FC) · bege = quem não apoia
const MANTO = 'repeating-linear-gradient(90deg,#181818 0 7px,#B89040 7px 14px)'
const BEGE = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'

const XI = {
  ATA: [{ n: 'Neymar', c: 'Santos · 2011', g: 2 }, { n: 'Mbappé', c: 'PSG · 2022', g: 1 }, { n: 'Bebeto', c: 'Vasco · 1989' }],
  MEI: [{ n: 'Messi', c: 'Barcelona · 2012', g: 3 }, { n: 'Ronaldinho', c: 'Barcelona · 2005' }, { n: null }],
  DEF: [{ n: 'R.Carlos', c: 'Real · 2002' }, { n: 'Lúcio', c: 'Inter · 2010' }, { n: 'Aldair', c: 'Roma · 1994' }, { n: 'Cafu', c: 'Milan · 2004' }],
  GOL: [{ n: 'Taffarel', c: 'Brasil · 1994' }],
}
const TAG = { ATA: 'ATA', MEI: 'MEI', DEF: 'ZAG', GOL: 'GOL' }

// ── um jogador SOLTO no gramado ────────────────────────────────────────────
const boneco = (j, k, alt, fonteNome, fundo) => j.n === null ? `
  <div class="vaga">
    <span class="anel" style="width:${Math.round(alt * .78)}px;height:${Math.round(alt * .78)}px;font-size:${Math.round(alt * .34)}px">+</span>
    <span class="selo">${TAG[k]}</span>
  </div>` : `
  <div class="jog">
    <div class="corpo" style="height:${alt}px">
      <span class="fig">
        <span class="inicial" style="width:${Math.round(alt * .72)}px;height:${Math.round(alt * .72)}px;font-size:${Math.round(alt * .38)}px;background:${fundo}">${j.n[0]}</span>
        ${j.g ? `<span class="gol">⚽${j.g}</span>` : ''}
      </span>
    </div>
    <p class="nome" style="font-size:${fonteNome}px"><span class="pos">${TAG[k]}</span>${j.n}</p>
    <p class="clube" style="font-size:${(fonteNome * .76).toFixed(1)}px">${j.c ?? ''}</p>
  </div>`

// ── campinho: `livre` = como ficou · senão a fichinha branca de antes ──
const pitch = ({ listra, alt, fonteNome, titulo, livre, fundo = MANTO, topo = MANTO }) => `
<div class="pitch">
  ${titulo ? `<div class="topo" style="background:${topo}"><span>${titulo}</span></div>` : ''}
  <div class="grama" style="background:repeating-linear-gradient(180deg,#1B7A3D 0 ${listra}px,#166332 ${listra}px ${listra * 2}px)">
    ${['ATA', 'MEI', 'DEF', 'GOL'].map(k => `
    <div class="linha">${XI[k].map(j => livre
      ? boneco(j, k, alt, XI[k].length > 3 ? fonteNome * .84 : fonteNome, fundo)
      : `<div class="ficha">
           <span class="faixa" style="background:${MANTO}"><b>${TAG[k]}</b></span>
           <p class="fn">${j.n ?? 'Vazio'}</p>
           ${j.g ? `<p class="fg">⚽ ${j.g}</p>` : ''}
         </div>`).join('')}</div>`).join('')}
  </div>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:#F4ECD6;color:#0C0C0C;padding:74px 48px 56px;
  font-family:system-ui,'Segoe UI',Roboto,sans-serif;display:flex;flex-direction:column}
.pill{align-self:flex-start;display:inline-flex;align-items:center;gap:12px;background:#FFC400;border:4px solid #0C0C0C;
  border-radius:999px;padding:12px 28px;font-family:D,sans-serif;font-weight:700;font-size:24px;letter-spacing:.10em;
  text-transform:uppercase;box-shadow:6px 6px 0 #0C0C0C}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:96px;line-height:.94;margin:30px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:29px;line-height:1.4;font-weight:600;color:rgba(12,12,12,.74);margin-top:22px}
.lead b{color:#0C0C0C}

.par{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:stretch;margin-top:38px;flex:1;min-height:0}
.par>div{display:flex;flex-direction:column;min-height:0}
.rot{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:20px;letter-spacing:.07em;
  background:#0C0C0C;color:#fff;padding:11px 16px;border-radius:14px 14px 0 0;text-align:center}
.rot.ok{background:#1B7A3D}
.cx{border:4px solid #0C0C0C;border-top:0;border-radius:0 0 16px 16px;box-shadow:6px 6px 0 #0C0C0C;background:#fff;padding:12px;flex:1;display:flex}

.pitch{border:3px solid #0C0C0C;border-radius:12px;overflow:hidden;flex:1;display:flex;flex-direction:column}
.topo{border-bottom:3px solid #0C0C0C;height:30px;display:flex;align-items:center;justify-content:center}
.topo span{font-family:D,sans-serif;font-weight:700;text-transform:uppercase;font-size:14px;color:#fff;
  letter-spacing:.08em;text-shadow:1.5px 1.5px 0 #000}
.grama{padding:16px 10px 18px;display:flex;flex-direction:column;justify-content:space-around;flex:1;gap:16px}
.linha{display:flex;justify-content:center;align-items:flex-end;gap:6px}

/* ── o jogador SOLTO ── */
.jog{flex:1 1 0;min-width:0;text-align:center}
.corpo{display:flex;align-items:flex-end;justify-content:center}
.fig{position:relative;display:inline-block;line-height:0}
.inicial{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:4px solid #0C0C0C;
  font-family:D,sans-serif;font-weight:700;color:#fff;line-height:1;box-shadow:3px 4px 0 rgba(0,0,0,.45);
  text-shadow:2px 2px 0 #0C0C0C,-2px 2px 0 #0C0C0C,2px -2px 0 #0C0C0C,-2px -2px 0 #0C0C0C}
.gol{position:absolute;right:-12px;top:2%;font-family:D,sans-serif;font-weight:700;font-size:13px;color:#0C0C0C;
  background:#FFC400;border:2.5px solid #0C0C0C;border-radius:8px;padding:0 6px;line-height:1.6;white-space:nowrap}
.nome{font-family:D,sans-serif;font-weight:700;text-transform:uppercase;color:#fff;margin-top:6px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15;
  text-shadow:2px 2px 0 #0C0C0C,-2px 2px 0 #0C0C0C,2px -2px 0 #0C0C0C,-2px -2px 0 #0C0C0C}
.pos{font-size:.62em;background:#0C0C0C;color:#fff;border-radius:6px;padding:0 5px;margin-right:5px;
  letter-spacing:.04em;text-shadow:none;vertical-align:middle}
.clube{font-family:D,sans-serif;font-weight:600;text-transform:uppercase;color:rgba(255,255,255,.85);
  letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1.5px 1.5px 0 rgba(0,0,0,.8)}
.vaga{flex:1 1 0;min-width:0;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:7px}
.anel{display:inline-flex;align-items:center;justify-content:center;border:3.5px dashed rgba(255,255,255,.75);
  border-radius:50%;color:rgba(255,255,255,.9);font-family:D,sans-serif;font-weight:700}
.selo{font-family:D,sans-serif;font-weight:700;font-size:13px;color:#fff;background:#0C0C0C;border-radius:7px;
  padding:2px 9px;letter-spacing:.06em}

/* ── a fichinha branca de antes ── */
.ficha{position:relative;border:2.5px solid #0C0C0C;border-radius:9px;background:#fff;text-align:center;overflow:hidden;
  font-family:D,sans-serif;flex:1 1 0;min-width:0;max-width:112px;padding:26px 7px 6px}
.faixa{position:absolute;top:0;left:0;right:0;height:19px;border-bottom:2.5px solid #0C0C0C;display:flex;
  align-items:center;justify-content:center}
.faixa b{font-size:10px;font-weight:700;color:#fff;background:rgba(0,0,0,.45);border-radius:6px;padding:0 6px;line-height:1.6}
.fn{font-size:17px;font-weight:700;color:#0C0C0C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15}
.fg{font-size:12px;font-weight:700;color:#1B7A3D;line-height:1.25}

.nota{margin-top:36px;border:5px solid #0C0C0C;border-radius:24px;box-shadow:7px 7px 0 #0C0C0C;background:#fff;overflow:hidden}
.nota .tit{background:#0C0C0C;color:#fff;font-family:D,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:23px;letter-spacing:.12em;padding:14px 26px}
.nota .corpo2{padding:22px 26px 24px;display:flex;flex-direction:column;gap:16px}
.nota .item{display:flex;gap:14px;align-items:flex-start}
.nota .ico{font-size:30px;line-height:1.1}
.nota p{font-size:25px;line-height:1.34;font-weight:600;color:rgba(12,12,12,.82)}
.nota p b{color:#0C0C0C}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:30px;padding:0 6px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:38px;display:flex;align-items:center;gap:12px}
.marca span{color:#C2452F}
.site{font-family:D,sans-serif;font-weight:600;font-size:24px;color:rgba(12,12,12,.45)}
</style>
<div class="pill">⚽ O campinho novo</div>
<h1>Agora o jogador fica <span class="r">solto no gramado</span></h1>
<p class="lead">Nome grande e contornado, <b>clube · ano</b> embaixo, e a bolinha da inicial
<b>nas cores do manto do seu clube</b>.</p>

<div class="par">
  <div>
    <div class="rot">Como era</div>
    <div class="cx">${pitch({ listra: 38, alt: 0, fonteNome: 17, livre: false })}</div>
  </div>
  <div>
    <div class="rot ok">▶ Como ficou</div>
    <div class="cx">${pitch({ listra: 44, alt: 96, fonteNome: 17, titulo: '⭐ Titulares', livre: true })}</div>
  </div>
</div>

<div class="nota">
  <div class="tit">O que muda pra quem joga</div>
  <div class="corpo2">
    <div class="item"><span class="ico">🎽</span><p>A cor é sempre a <b>do seu clube</b>. Quem ainda não apoia vê <b>bege</b> — ninguém pega cor emprestada.</p></div>
    <div class="item"><span class="ico">🟢</span><p>Faltou gente? A vaga vira um <b>círculo tracejado com “+”</b> e o selo da posição. Dá pra ver de longe o que falta.</p></div>
    <div class="item"><span class="ico">🔨</span><p>Vale em <b>tudo</b>: leilão, jogo rápido, online e carreira.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
