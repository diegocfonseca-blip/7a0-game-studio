#!/usr/bin/env node
// ─── 📱✨ MOCKUP: o BRILHO na palavra WhatsApp (linha sutil das salas abertas) ──
//
// Pedido do Diego (25/09): *"aquele texto sutil embaixo das salas abertas onde
// fala do grupo do WhatsApp. Coloque algum tipo de brilho na parte escrita
// WhatsApp, pra quem tá procurando galera pra jogar junto… pra pessoa ler que
// entra no grupo do WhatsApp se quiser"*.
//
// ⚠️ ACHADO: a linha de hoje NÃO escreve "WhatsApp" — ela diz só "Tem um grupo de
//    quem joga online". Então o trabalho é DOIS: escrever a palavra na frase e
//    acender ela.
//
// A linha continua SUTIL (ordem de 29/08: *"de forma mais sutil"*) — o resto do
// texto fica no mesmo cinza de rodapé. Só a palavra acende. E o brilho é CSS
// puro: 0 KB, igual o padrão do ApoioSheen.
//
// Rodar do raiz do repo: node scripts/mockup-brilho-whatsapp.mjs /tmp/brilho.png
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const b64 = w => readFileSync(`${ROOT}/scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', ZAP = '#25D366'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

// a frase, do jeito que vai ficar. `%W%` é onde entra a palavra acesa.
const FRASE = `📱 Sem galera pra chamar? Tem um grupo no %W% de quem joga online — é do ⭐ Craque pra cima. <u>Saiba mais</u>`

const linha = (palavra, extra = '') => `<p class="rodape">${extra}${FRASE.replace('%W%', palavra)}</p>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#EFE9DA;font-family:system-ui;color:${INK};padding:26px}
.wrap{max-width:900px;margin:0 auto}
h1{${OSW};font-size:20px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
.sub{font-size:13px;font-weight:600;color:#3d3a30;margin-bottom:16px;line-height:1.5}
.passo{${OSW};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:rgba(12,12,12,.45);margin:16px 0 6px}
/* a tela do jogo: fundo tinta, igual o lobby (backgroundColor: INK) */
.tela{background:${INK};border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:13px 14px}
.btn{${OSW};font-size:13px;text-transform:uppercase;background:#fff;color:#000;border:3px solid #000;
  border-radius:12px;box-shadow:3px 3px 0 #000;padding:9px 0;text-align:center;margin-bottom:11px}
.rodape{font-size:11.5px;font-weight:700;line-height:1.45;text-align:center;color:rgba(255,255,255,.35)}
.rodape u{color:rgba(255,255,255,.6);font-weight:900}
.zap{color:${ZAP};font-weight:900}
/* ① brilho que RESPIRA — o halo cresce e diminui, sem sair do lugar */
.g1{text-shadow:0 0 9px rgba(37,211,102,.95),0 0 22px rgba(37,211,102,.5)}
.g1b{text-shadow:0 0 4px rgba(37,211,102,.5),0 0 11px rgba(37,211,102,.22)}
/* ② brilho PASSANDO — uma luz atravessa a palavra (padrão do ApoioSheen) */
/* ⚠️ a luz vai de VERDE a BRANCO e volta ao VERDE — nunca a transparente. No 1º
   corte a ponta do degradê era transparente e, com o fundo tinta atrás, as
   letras do meio da palavra SUMIAM (virava um borrão). */
.g2{position:relative;filter:drop-shadow(0 0 5px rgba(37,211,102,.6));background:linear-gradient(100deg,
  ${ZAP} 18%,#EAFFF1 44%,#fff 50%,#EAFFF1 56%,${ZAP} 82%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.g2b{text-shadow:0 0 6px rgba(37,211,102,.55)}
/* ③ brilho + bolinha viva antes da frase (a mesma do selo Multiplayer lá em cima) */
.pt{display:inline-block;width:7px;height:7px;border-radius:99px;background:${ZAP};margin-right:5px;
  box-shadow:0 0 8px rgba(37,211,102,.9);vertical-align:1px}
.cap{font-size:12px;font-weight:500;color:#3d3a30;line-height:1.5;margin-top:8px}
.cap b{font-weight:800}
.nota{background:#fff;border:3px solid ${INK};border-radius:13px;padding:12px 14px;font-size:12.5px;
  font-weight:500;line-height:1.6;color:#3d3a30;margin-top:18px}
.hoje{background:${INK};border:4px solid ${INK};border-radius:16px;padding:13px 14px;box-shadow:5px 5px 0 ${INK}}
.duo{display:flex;gap:12px}
.duo>div{flex:1}
.et{${OSW};font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:rgba(12,12,12,.4);margin-bottom:4px}
</style></head><body><div class="wrap">

<h1>📱✨ O brilho na palavra WhatsApp</h1>
<p class="sub">A linha fica <b>igual de sutil</b> — cinza de rodapé, sem caixa, sem botão. Só a palavra <b>WhatsApp</b> acende, porque é ela que a pessoa está procurando quando não tem galera pra jogar. Brilho é <b>CSS puro: 0 KB</b>.</p>

<p class="passo">como está hoje (sem a palavra nem brilho)</p>
<div class="hoje">
  <div class="btn">🔄 Atualizar lista</div>
  <p class="rodape">📱 Sem galera pra chamar? Tem um grupo de quem joga online — é do ⭐ Craque pra cima. <u>Saiba mais</u></p>
</div>
<p class="cap"><b>O problema:</b> a frase nem escreve "WhatsApp". Quem bate o olho não sabe que é um grupo de zap — parece coisa de dentro do jogo.</p>

<p class="passo">① brilho que respira (o halo cresce e diminui, 2,4s)</p>
<div class="tela">
  <div class="btn">🔄 Atualizar lista</div>
  ${linha('<span class="zap g1">WhatsApp</span>')}
</div>
<div class="duo" style="margin-top:9px">
  <div><p class="et">no pico</p><div class="tela" style="padding:9px 12px">${linha('<span class="zap g1">WhatsApp</span>')}</div></div>
  <div><p class="et">no fundo do respiro</p><div class="tela" style="padding:9px 12px">${linha('<span class="zap g1b">WhatsApp</span>')}</div></div>
</div>
<p class="cap"><b>A mais calma.</b> Chama o olho sem pular na cara e nunca "pisca" — é um respiro lento, como o ponto verde do Multiplayer lá no topo da tela.</p>

<p class="passo">② brilho passando (uma luz atravessa a palavra a cada 3,2s)</p>
<div class="tela">
  <div class="btn">🔄 Atualizar lista</div>
  ${linha('<span class="zap g2">WhatsApp</span>')}
</div>
<div class="duo" style="margin-top:9px">
  <div><p class="et">luz no meio da palavra</p><div class="tela" style="padding:9px 12px">${linha('<span class="zap g2">WhatsApp</span>')}</div></div>
  <div><p class="et">entre uma luz e outra</p><div class="tela" style="padding:9px 12px">${linha('<span class="zap g2b">WhatsApp</span>')}</div></div>
</div>
<p class="cap"><b>A mais chamativa.</b> É o mesmo brilho dos escudos de apoiador (ApoioSheen) — parece que a palavra é de metal. Chama mais, mas repete mais também.</p>

<p class="passo">③ brilho que respira + bolinha viva antes da frase</p>
<div class="tela">
  <div class="btn">🔄 Atualizar lista</div>
  ${linha('<span class="zap g1">WhatsApp</span>', '<span class="pt"></span>')}
</div>
<p class="cap"><b>A mais “tem gente aí”.</b> A bolinha verde é a mesma do selo Multiplayer — dá cara de grupo ativo, mas é um pontinho a mais numa linha que era pra ser discreta.</p>

<div class="nota">🔒 <b>O que NÃO muda:</b> o tamanho da letra, o lugar (embaixo do Atualizar lista), o tom cinza do resto da frase e pra onde o clique vai (⭐ Craque no Apoie, ou o Instagram pra quem já tem vaga). Quem já é Craque/Lenda vê a mesma linha, com o final <i>“e você já tem vaga nele”</i> — e a palavra acesa do mesmo jeito.<br>
↩️ <b>Reverter é uma linha:</b> o brilho é uma classe CSS só. Tirando ela, a frase volta ao cinza de sempre.</div>

</div></body></html>`

const out = process.argv[2] ?? 'mockup-brilho-whatsapp.png'
const htmlPath = path.join(path.dirname(path.resolve(out)), 'mockup-brilho-whatsapp.html')
writeFileSync(htmlPath, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })
await p.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: out, fullPage: true })
await b.close()
console.log('ok →', out)
