// ─── 🟩 A FAIXA DOS CLASSIFICADOS + os DOIS FORMATOS de grupos ───────────────
//
// Diego (19/09): *"pra ter as oitavas não deveria ter mais grupos? Me parece que
// tem muito time no mesmo grupo… E também precisa de faixa de classificação com
// cor pros dois primeiros do grupo, não? Confira no offline e no online"*.
//
// Este desenho responde os dois: à esquerda a tabela do grupo como é HOJE e como
// fica COM A FAIXA (prints do `CupScreen` de verdade, bancada
// `scripts/teste-copa-grupos`); à direita o formato de hoje (4 grupos de 6 → 8 →
// quartas) contra o formato de Copa de 24 (6 grupos de 4 → 16 → oitavas).
//
// Rodar:  node scripts/mockup-grupos-copa.mjs --hoje A.png --depois B.png [--saida /tmp/grupos.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/grupos-copa.png')
const HOJE = arg('hoje', ''), DEPOIS = arg('depois', '')
const INK = '#0C0C0C', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F', GOLD = '#FFC400'
const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const uri = f => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`

const lado = (rotulo, cor, sub, img) => `
  <div style="flex:1;min-width:0">
    <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:12px;color:#fff;background:${cor};border:2.5px solid ${INK};border-radius:7px;padding:2px 9px;box-shadow:2px 2px 0 ${INK}">${rotulo}</span>
    <div style="font-size:12px;color:rgba(12,12,12,.7);line-height:1.45;margin:8px 0 9px;min-height:52px">${sub}</div>
    <div style="border:4px solid ${cor};border-radius:14px;box-shadow:5px 5px 0 ${INK};overflow:hidden;background:${CREME}"><img src="${img}" style="display:block;width:100%"></div>
  </div>`

const grupo = (letra, times, verdes, amarelo) => `
  <div style="background:#fff;border:2.5px solid ${INK};border-radius:10px;padding:6px 8px;box-shadow:2px 2px 0 ${INK}">
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:12px;margin-bottom:3px">GRUPO ${letra}</div>
    ${Array.from({ length: times }, (_, i) => `<div style="font-size:10.5px;padding:2px 6px;border-radius:5px;margin-bottom:2px;border-left:4px solid ${i < verdes ? VERDE : i === verdes && amarelo ? GOLD : 'transparent'};background:${i < verdes ? '#D8F0DE' : i === verdes && amarelo ? '#FFF1BF' : 'transparent'}">${i + 1}º ${i < verdes ? '· classifica' : i === verdes && amarelo ? '· briga pelas 4 vagas de 3º' : ''}</div>`).join('')}
  </div>`

const formato = (rotulo, cor, titulo, sub, nGrupos, times, verdes, amarelo, chave) => `
  <div style="flex:1;min-width:0;background:#FFFDF5;border:4px solid ${cor};border-radius:16px;box-shadow:5px 5px 0 ${INK};padding:13px 15px">
    <span style="font-family:Oswald,sans-serif;font-weight:700;font-size:12px;color:#fff;background:${cor};border:2.5px solid ${INK};border-radius:7px;padding:2px 9px">${rotulo}</span>
    <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:21px;margin:8px 0 2px">${titulo}</div>
    <div style="font-size:12px;color:rgba(12,12,12,.65);line-height:1.45;margin-bottom:10px">${sub}</div>
    <div style="display:grid;grid-template-columns:repeat(${nGrupos === 4 ? 2 : 3},1fr);gap:7px">${'ABCDEF'.slice(0, nGrupos).split('').map(l => grupo(l, times, verdes, amarelo)).join('')}</div>
    <div style="margin-top:10px;font-family:Oswald,sans-serif;font-weight:700;font-size:13px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">${chave.map((c, i) => `<span style="background:${i === 0 ? GOLD : '#fff'};border:2px solid ${INK};border-radius:8px;padding:3px 8px">${c}</span>${i < chave.length - 1 ? '→' : ''}`).join('')}</div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}*{box-sizing:border-box}body{margin:0;background:${CREME};font-family:Arial,sans-serif;padding:26px 24px 30px;width:1240px}</style></head><body>
 <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:33px;line-height:1.05">FASE DE GRUPOS DA COPA: A FAIXA E O FORMATO</div>
 <div style="font-size:14px;color:rgba(12,12,12,.68);margin:6px 0 20px;line-height:1.5;max-width:1000px">Você viu certo nas duas: <b>não tem faixa</b> (era um branco a 6%, invisível no creme — igual no online e na carreira, é a mesma tabela) e <b>não tem oitavas</b> porque são só 4 grupos, de 6, e passam 8.</div>
 <div style="display:flex;gap:18px;align-items:flex-start">
   <div style="flex:1.15;min-width:0">
     <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;margin-bottom:8px">1 · A FAIXA DOS CLASSIFICADOS</div>
     <div style="display:flex;gap:14px">
       ${lado('HOJE', VERM, 'Os dois primeiros não têm cor nenhuma. Só a SUA linha fica dourada.', uri(HOJE))}
       ${lado('COM A FAIXA', VERDE, 'Os 2 primeiros em <b>verde</b> com a barra na esquerda — o mesmo verde da zona de classificação da tabela da liga. A sua linha continua dourada, e ganha a barra se está classificando. Legenda embaixo.', uri(DEPOIS))}
     </div>
   </div>
   <div style="flex:1;min-width:0">
     <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px;margin-bottom:8px">2 · O FORMATO DOS GRUPOS</div>
     <div style="display:flex;flex-direction:column;gap:14px">
       ${formato('HOJE', VERM, '4 grupos de 6', '5 rodadas · passam 2 por grupo = <b>8</b>. Não tem oitavas: vai direto pras quartas.', 4, 6, 2, false, ['24 seleções', '4 grupos', '8', 'quartas', 'semi', 'final'])}
       ${formato('PROPOSTA · COPA DE 24 (86 · 90 · 94)', VERDE, '6 grupos de 4', '3 rodadas · passam os 2 primeiros + os <b>4 melhores 3ºs</b> = <b>16</b>. Aí tem oitavas. É o formato das Copas do México 86, Itália 90 e EUA 94 — também de 24.', 6, 4, 2, true, ['24 seleções', '6 grupos', '16', 'oitavas', 'quartas', 'semi', 'final'])}
     </div>
   </div>
 </div>
 <div style="background:#FFF6E0;border:4px solid ${INK};border-radius:16px;box-shadow:5px 5px 0 rgba(0,0,0,.25);padding:14px 16px;margin-top:20px">
   <div style="font-family:Oswald,sans-serif;font-weight:700;font-size:19px">✅ O QUE CADA UMA CUSTA</div>
   <ul style="margin:9px 0 0;padding-left:20px;font-size:13.5px;color:rgba(12,12,12,.8);line-height:1.7">
     <li><b>A faixa</b> é só desenho: já está pronta no branch, vale pro online e pra carreira de uma vez (é a mesma tabela). Sobe com o seu OK.</li>
     <li><b>Os 6 grupos de 4</b> mudam o motor: fase de grupos mais curta (3 rodadas em vez de 5), uma fase a mais no mata-mata (oitavas, jogo único), a régua dos melhores 3ºs, um degrau a mais no prêmio da carreira, e o relógio da sala no banco. Dá pra fazer — mas é decisão sua.</li>
     <li>Nenhuma das duas mexe em Copa já encerrada.</li>
   </ul>
 </div>
</body></html>`
const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await nav.newPage({ viewport: { width: 1240, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400)
await p.screenshot({ path: SAIDA, fullPage: true }); await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
