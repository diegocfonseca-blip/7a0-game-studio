#!/usr/bin/env node
// ─── 🖼️ MOCKUP: o rosto NO CAMPINHO, com o jogador SOLTO no gramado ─────────
//
// 1ª versão (fichinha branca com o rosto dentro) foi reprovada: *"o mockup q vc
// mandou N ficou legal... mantenha padrões visuais do campinho... mas o jogador
// é ele livre"*. Ele mandou o meuonze de referência: lá o boneco fica SOLTO na
// grama, sem caixa, com o nome embaixo e o clube menor.
//
// O que muda e o que FICA:
//   ❌ sai a fichinha branca com borda (era ela que "engaiolava" o jogador)
//   ✅ fica o gramado listrado, o traço preto grosso e a moldura do campinho
//   ✅ fica o MANTO do dono — vira o brasãozinho ao lado da cabeça, no lugar
//      da bandeirinha que o concorrente usa (a cor do clube DELE, não a do
//      jogador). Regra do Diego: cada um leva a cor do próprio tier/manto.
//   ✅ fica a posição, agora num selinho preto colado no nome
//   ✅ vaga vazia = círculo tracejado com "+", que é o que faz o time
//      incompleto parecer "falta gente aqui" em vez de "bug"
//
// ⚠️ Medidas do código de verdade (não chutadas):
//   · leilão  → `Campinho` em `screens.tsx`: gramado listrado de 34px
//   · elenco  → `pyramidseason.tsx`: gramado listrado de 38px, nome 10,5px
// O campinho fica MAIS ALTO que hoje — é o preço de o boneco caber, e o Diego
// já falou que topa ("talvez deixe mais comprido").
//
//   node scripts/rosto/mockup-campinho.mjs --fotos /tmp/faces --saida /tmp/campinho.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d
}
const saida = arg('saida', 'campinho.png')
const dir = arg('fotos', '')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`
const img = p => `data:image/${path.extname(p).slice(1)};base64,${b64(p)}`

// manto de exemplo: preto e dourado (o do Futpoint FC)
const MANTO = 'repeating-linear-gradient(90deg,#181818 0 6px,#B89040 6px 12px)'

const F = k => (dir ? img(path.join(dir, k)) : '')
const XI = {
  ATA: [{ n: 'Neymar', c: 'Santos · 2011', f: F('face-a.png'), g: 2 },
        { n: 'Mbappé', c: 'PSG · 2022', f: F('face-d.png'), g: 1 },
        { n: 'Bebeto', c: 'Vasco · 1989' }],
  MEI: [{ n: 'Messi', c: 'Barcelona · 2012', f: F('face-c.png'), g: 3 },
        { n: 'Ronaldinho', c: 'Barcelona · 2005', f: F('face-b.png') },
        { n: null }],
  DEF: [{ n: 'R. Carlos', c: 'Real · 2002' }, { n: 'Lúcio', c: 'Inter · 2010' },
        { n: 'Aldair', c: 'Roma · 1994' }, { n: 'Cafu', c: 'Milan · 2004' }],
  GOL: [{ n: 'Taffarel', c: 'Brasil · 1994' }],
}
const TAG = { ATA: 'ATA', MEI: 'MEI', DEF: 'ZAG', GOL: 'GOL' }

// ── um jogador SOLTO no gramado ────────────────────────────────────────────
const boneco = (j, k, alt, fonteNome) => j.n === null ? `
  <div class="vaga">
    <span class="anel" style="width:${alt * .8}px;height:${alt * .8}px">+</span>
    <span class="selo">${TAG[k]}</span>
  </div>` : `
  <div class="jog">
    <div class="corpo" style="height:${alt}px">
      <span class="fig">
        ${j.f ? `<img src="${j.f}" style="height:${alt}px">`
              : `<span class="semfoto" style="width:${Math.round(alt * .60)}px;height:${Math.round(alt * .60)}px;font-size:${Math.round(alt * .32)}px">${j.n[0]}</span>`}
        <span class="brasao" style="width:${Math.round(alt * .30)}px;height:${Math.round(alt * .30)}px;background:${MANTO}"></span>
        ${j.g ? `<span class="gol">⚽${j.g}</span>` : ''}
      </span>
    </div>
    <p class="nome" style="font-size:${fonteNome}px"><span class="pos">${TAG[k]}</span>${j.n}</p>
    <p class="clube" style="font-size:${(fonteNome * .78).toFixed(1)}px">${j.c ?? ''}</p>
  </div>`

// ── campinho: `livre` = proposta nova · senão o de hoje (fichinha branca) ──
const pitch = ({ listra, alt, fonteNome, titulo, livre }) => `
<div class="pitch">
  ${titulo ? `<div class="topo"><span>${titulo}</span></div>` : ''}
  <div class="grama" style="background:repeating-linear-gradient(180deg,#1B7A3D 0 ${listra}px,#166332 ${listra}px ${listra * 2}px)">
    ${['ATA', 'MEI', 'DEF', 'GOL'].map(k => `
    <div class="linha">${XI[k].map(j => livre
      ? boneco(j, k, alt, fonteNome)
      : `<div class="ficha">
           <span class="faixa" style="background:${MANTO}"><b>${TAG[k]}</b></span>
           <p class="fn" style="font-size:${fonteNome}px">${j.n ?? 'Vazio'}</p>
           ${j.g ? `<p class="fg">⚽ ${j.g}</p>` : ''}
         </div>`).join('')}</div>`).join('')}
  </div>
</div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;background:#F4ECD6;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#0C0C0C;padding:34px 30px 26px}
.pill{display:inline-flex;align-items:center;gap:9px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:9px 20px;font-weight:700;font-size:16px;letter-spacing:.10em;box-shadow:4px 4px 0 #0C0C0C;
  font-family:Oswald,sans-serif;text-transform:uppercase}
h1{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:58px;line-height:.98;margin:18px 0 0}
h1 .r{color:#C2452F}
.lead{font-size:17.5px;line-height:1.45;color:rgba(12,12,12,.72);margin-top:13px;max-width:990px}
.lead b{color:#0C0C0C}
h2{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:22px;margin:28px 0 12px;
  letter-spacing:.03em;display:flex;align-items:baseline;gap:10px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.48)}
.par{display:grid;grid-template-columns:0.78fr 1.22fr;gap:18px;align-items:start}
.col .rot{font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:700;font-size:13px;letter-spacing:.08em;
  background:#0C0C0C;color:#fff;padding:8px 12px;border-radius:10px 10px 0 0}
.col .rot.ok{background:#1B7A3D}
.col .cx{border:3px solid #0C0C0C;border-radius:0 0 12px 12px;box-shadow:4px 4px 0 #0C0C0C;background:#fff;padding:10px}

.pitch{border:3px solid #0C0C0C;border-radius:14px;overflow:hidden}
.topo{background:${MANTO};border-bottom:3px solid #0C0C0C;height:24px;display:flex;align-items:center;justify-content:center}
.topo span{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;font-size:10.5px;color:#fff;
  letter-spacing:.08em;text-shadow:1px 1px 0 #000}
.grama{padding:14px 10px 16px;display:flex;flex-direction:column;gap:16px}
.linha{display:flex;justify-content:center;align-items:flex-end;gap:8px}

/* ── o jogador SOLTO ── */
.jog{flex:1 1 0;min-width:0;text-align:center}
.corpo{display:flex;align-items:flex-end;justify-content:center}
.fig{position:relative;display:inline-block;line-height:0}
.fig img{display:block;width:auto;object-fit:contain;filter:drop-shadow(2px 3px 0 rgba(0,0,0,.45))}
.semfoto{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#F4ECD6;
  border:2.5px solid #0C0C0C;font-family:Oswald,sans-serif;font-weight:700;color:#0C0C0C;line-height:1;
  box-shadow:2px 2px 0 rgba(0,0,0,.45)}
.brasao{position:absolute;left:-9px;top:8%;border-radius:50%;border:2.5px solid #0C0C0C;box-shadow:1.5px 1.5px 0 rgba(0,0,0,.5)}
.gol{position:absolute;right:-10px;top:4%;font-family:Oswald,sans-serif;font-weight:700;font-size:9px;color:#0C0C0C;
  background:#FFC400;border:2px solid #0C0C0C;border-radius:7px;padding:0 4px;line-height:1.6;white-space:nowrap}
.nome{font-family:Oswald,sans-serif;font-weight:700;text-transform:uppercase;color:#fff;margin-top:3px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15;
  text-shadow:1.5px 1.5px 0 #0C0C0C,-1.5px 1.5px 0 #0C0C0C,1.5px -1.5px 0 #0C0C0C,-1.5px -1.5px 0 #0C0C0C}
.pos{font-size:.62em;background:#0C0C0C;color:#fff;border-radius:5px;padding:0 4px;margin-right:4px;
  letter-spacing:.04em;text-shadow:none;vertical-align:middle}
.clube{font-family:Oswald,sans-serif;font-weight:600;text-transform:uppercase;color:rgba(255,255,255,.82);
  letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:1px 1px 0 rgba(0,0,0,.75)}
.vaga{flex:1 1 0;min-width:0;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px}
.anel{display:inline-flex;align-items:center;justify-content:center;border:2.5px dashed rgba(255,255,255,.7);
  border-radius:50%;color:rgba(255,255,255,.85);font-family:Oswald,sans-serif;font-weight:700;font-size:22px}
.selo{font-family:Oswald,sans-serif;font-weight:700;font-size:9px;color:#fff;background:#0C0C0C;border-radius:6px;
  padding:1px 7px;letter-spacing:.06em}

/* ── a fichinha de hoje, pra comparar ── */
.ficha{position:relative;border:2px solid #0C0C0C;border-radius:8px;background:#fff;text-align:center;overflow:hidden;
  font-family:Oswald,sans-serif;flex:1 1 0;min-width:0;max-width:96px;padding:17px 6px 3px}
.faixa{position:absolute;top:0;left:0;right:0;height:14px;border-bottom:2px solid #0C0C0C;display:flex;
  align-items:center;justify-content:center}
.faixa b{font-size:7px;font-weight:700;color:#fff;background:rgba(0,0,0,.42);border-radius:6px;padding:0 5px;line-height:1.6}
.fn{font-weight:800;color:#0C0C0C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15}
.fg{font-size:8.5px;font-weight:800;color:#1B7A3D;line-height:1.2}

.nota{margin-top:26px;border:4px solid #0C0C0C;border-radius:18px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;overflow:hidden}
.nota .tit{background:#0C0C0C;color:#fff;font-family:Oswald,sans-serif;text-transform:uppercase;font-weight:600;
  font-size:14.5px;letter-spacing:.12em;padding:10px 16px}
.nota .corpo2{padding:14px 18px 16px;display:grid;grid-template-columns:1fr 1fr;gap:14px 22px}
.nota h4{font-family:Oswald,sans-serif;text-transform:uppercase;font-size:13px;letter-spacing:.10em;opacity:.55;font-weight:600}
.nota p{font-size:14.5px;line-height:1.42;margin-top:5px;font-weight:600;color:rgba(12,12,12,.8)}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding:0 4px}
.marca{font-family:Oswald,sans-serif;font-weight:700;font-size:21px;display:flex;align-items:center;gap:8px}
.marca span{color:#C2452F}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>
<div class="pill">🖼️ Mockup 2 · jogador solto no gramado</div>
<h1>Sem gaiola, <span class="r">só o jogador</span></h1>
<p class="lead">Você tem razão: a fichinha branca engaiolava o boneco. Agora ele fica <b>solto na grama</b>, com o nome
embaixo e o clube menor. O que é nosso <b>fica</b>: gramado listrado, traço preto grosso e o <b>seu manto</b> —
ele virou o <b>brasãozinho ao lado da cabeça</b> (no lugar da bandeirinha do outro jogo). O campinho fica
<b>mais alto</b> que hoje, que é o preço de o boneco caber.</p>

<h2>1 · Campinho do ELENCO da carreira <small>o de olhar o time com calma</small></h2>
<div class="par">
  <div class="col"><div class="rot">Como está hoje</div><div class="cx">
    ${pitch({ listra: 38, alt: 0, fonteNome: 10.5, livre: false })}</div></div>
  <div class="col"><div class="rot ok">▶ Proposta — jogador livre</div><div class="cx">
    ${pitch({ listra: 44, alt: 74, fonteNome: 12.5, titulo: '⭐ Titulares', livre: true })}</div></div>
</div>

<h2>2 · Campinho do LEILÃO <small>divide a tela com o lance, então o boneco entra menor</small></h2>
<div class="par">
  <div class="col"><div class="rot">Como está hoje</div><div class="cx">
    ${pitch({ listra: 34, alt: 0, fonteNome: 11, livre: false })}</div></div>
  <div class="col"><div class="rot ok">▶ Proposta — jogador livre</div><div class="cx">
    ${pitch({ listra: 38, alt: 56, fonteNome: 11, titulo: '⭐ Titulares', livre: true })}</div></div>
</div>

<div class="nota">
  <div class="tit">O que eu mantive do nosso e o que peguei da referência</div>
  <div class="corpo2">
    <div><h4>✅ Continua nosso</h4><p>Gramado listrado verde, moldura preta grossa do campinho, Oswald no nome,
      e a <b>vaga vazia com o "+"</b> — é ela que faz time incompleto parecer "falta gente", não bug.</p></div>
    <div><h4>🎽 O manto virou brasão</h4><p>A faixa listrada saiu do topo da fichinha e virou a <b>bolinha ao lado da
      cabeça</b>, nas cores do SEU clube. Cada dono vê a cor dele — a regra de sempre.</p></div>
    <div><h4>👤 Quem ainda não tem rosto</h4><p>Entra a bolinha creme com a inicial, do mesmo tamanho — o campinho
      fica <b>alinhado</b> mesmo com metade dos rostos prontos.</p></div>
    <div><h4>📏 Fica mais alto</h4><p>No elenco o boneco tem 74px; no leilão, 56px (lá o campinho divide a tela com
      o lance). Se achar alto demais, é só baixar o número — não mexe em mais nada.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
