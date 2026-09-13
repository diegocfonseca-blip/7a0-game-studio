// 🖼️ MOCKUP — 🔁 RODÍZIO AUTOMÁTICO na caixa do Preparador Físico (Diego 13/09:
//   *"coloque um botão de troca automática, na qual o preparador informa as coisas
//   e automaticamente se troca, fazendo com que não atrapalhe pro cara ficar
//   mexendo toda hora"*).
// Mostra os 3 estados da MESMA caixa que já existe na aba Elenco, pra ele aprovar
// o visual antes de ir pra main (regra nº 2 do CLAUDE.md).
// Rodar: node scripts/mockup-rodizio-auto.mjs
import { chromium } from 'playwright-core'

const INK = '#0C0C0C', GREEN = '#1B7A3D', CREME = '#F4ECD6'

const caixa = (corpo) => `<div class="cx">
  <p class="tit">🧑‍⚕️ PREPARADOR FÍSICO</p>
  ${corpo}
</div>`

const btnRodiziar = (txt) => `<button class="b verde">🔁 RODIZIAR <span class="sub">— ${txt}</span></button>`
const btnAuto = (ligado) => `<button class="b ${ligado ? 'verde' : 'branco'} auto">
  ${ligado ? '✔ RODÍZIO AUTOMÁTICO LIGADO' : '🔁 LIGAR RODÍZIO AUTOMÁTICO'}
  <span class="sub2">${ligado ? 'o preparador troca sozinho antes de cada jogo — toque pra voltar a decidir' : 'deixa o preparador trocar sozinho, sem você ter que mexer toda rodada'}</span>
</button>`

const painel = (titulo, nota, dentro) => `<section>
  <h2>${titulo}</h2><p class="nota">${nota}</p>
  <div class="tela">${dentro}</div>
</section>`

const html = `<html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700;800;900&display=swap" rel="stylesheet">
<style>
body{margin:0;padding:28px;background:#DCD3BB;font-family:Arial,Helvetica,sans-serif;display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap}
section{width:430px}
h2{font-family:Oswald;font-weight:900;font-size:19px;letter-spacing:.5px;text-transform:uppercase;margin:0 0 3px;color:${INK}}
.nota{font-size:11.5px;font-weight:700;color:#5a5647;margin:0 0 10px;line-height:1.35;min-height:32px}
.tela{background:${CREME};border:3px solid ${INK};border-radius:14px;padding:14px;box-shadow:4px 4px 0 0 ${INK}}
.cx{border:3px solid ${INK};background:#FFF6D6;border-radius:11px;padding:9px 12px;box-shadow:3px 3px 0 0 ${INK}}
.tit{font-family:Oswald;font-weight:900;font-size:11px;letter-spacing:.6px;color:#5a5647;margin:0;text-transform:uppercase}
.txt{font-size:12px;font-weight:700;line-height:1.45;margin:4px 0 0;color:${INK}}
.b{width:100%;margin-top:8px;border:2.5px solid ${INK};border-radius:9px;padding:8px 10px;font-family:Oswald;font-weight:900;font-size:12.5px;box-shadow:2px 2px 0 0 ${INK};text-align:left;display:block}
.b.auto{font-size:11.5px;padding:7px 10px}
.verde{background:${GREEN};color:#fff}
.branco{background:#fff;color:${INK}}
.sub{font-family:Arial;font-weight:700;font-size:10.5px;opacity:.9}
.sub2{display:block;font-family:Arial;font-weight:700;font-size:10px;opacity:.85;margin-top:1px}
.pe{font-size:10px;font-weight:700;color:#5a5647;margin:6px 0 0;line-height:1.4}
</style></head><body>

${painel('1 · COMO É HOJE (automático desligado)', 'a caixa aparece quando algum titular passa dos 54 jogos. O botão verde é o de sempre; embaixo dele nasce o interruptor novo, branco.', caixa(`
  <p class="txt"><b>Romário</b> está <b style="color:#C2452F">no limite</b> (🥵) — joga com −2 e o risco de lesão dobra. <b>Sócrates</b> está <b style="color:#B8860B">cansado</b> (😓) — −1 no próximo jogo.</p>
  ${btnRodiziar('Careca no lugar de Romário · Falcão no lugar de Sócrates')}
  ${btnAuto(false)}
  <p class="pe">Titular perde gás a cada jogo · o banco devolve a cada rodada · vale do próximo jogo · o jogo nunca troca por você.</p>`))}

${painel('2 · AUTOMÁTICO LIGADO, COM CANSADO', 'ligado, o preparador JÁ aplicou a troca — o campinho ao lado já mostra o time que vai entrar. O botão verde some (não tem mais o que apertar).', caixa(`
  <p class="txt"><b>Zico</b> está <b style="color:#B8860B">cansado</b> (😓) — −1 no próximo jogo.</p>
  ${btnAuto(true)}
  <p class="pe">Sem reserva inteiro pra toda vaga — quem fica joga cansado. <b>Contrate no leilão de transferências.</b> Titular perde gás a cada jogo, o banco devolve · <b>rodízio automático ligado</b>: o preparador já trocou pro próximo jogo — você ainda pode mexer na mão.</p>`))}

${painel('3 · AUTOMÁTICO LIGADO, TIME INTEIRO', 'o normal do dia a dia: ninguém cansado porque o preparador já rodiziou. A caixa FICA (senão o interruptor de desligar sumiria junto).', caixa(`
  <p class="txt">Todo mundo do time está <b style="color:${GREEN}">inteiro</b> (💪) — o preparador está cuidando do rodízio.</p>
  ${btnAuto(true)}
  <p class="pe">Titular perde gás a cada jogo, o banco devolve · <b>rodízio automático ligado</b>: o preparador já trocou pro próximo jogo — você ainda pode mexer na mão.</p>`))}

</body></html>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1420, height: 640 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(1200)
const saida = process.env.SAIDA || '/tmp/mockup-rodizio-auto.png'
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log('✅', saida)
