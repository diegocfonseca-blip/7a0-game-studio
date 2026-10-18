#!/usr/bin/env node
// 🏆📞 MOCKUP — PATROCINADOR MASTER COM HISTÓRIA (17/10). Diego: "todo mundo escolhe sempre a Vadico… quero ideias melhores,
// com historinhas" → pediu a junção de 3 ideias: (1) a marca LIGA pra renovar quando o clube vai bem, (2) cada contrato vem com
// uma META que dá bônus, (3) a marca LARGA quem cai (paga multa e o clube volta pro mercado). Valores por temporada = os de hoje.
// uso: node scripts/mockup-master-historia.mjs → scripts/mockups/master-historia.png
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const b64 = f => readFileSync(f).toString('base64')
const FONTES = [500, 700].map(w => `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}) format('woff2');font-weight:${w}}`).join('')
const L = { max: 'patro-maxjoias', tintas: 'patro-reidastintas', ero: 'patro-ero', uomo: 'patro-uomo', vadico: 'patro-vadico' }
for (const k in L) L[k] = `data:image/webp;base64,${b64(`src/escalacao/img/${L[k]}.webp`)}`
const base = 16 // Série B
const mult = [1.25, 1.75, 2.25, 2.75, 3.25]
const C = [
  ['max', 'Max Joias', 1, '🚀 Subir pra Série A', 30],
  ['tintas', 'Rei das Tintas', 2, '🏅 Terminar no G4', 20],
  ['ero', 'ERO Odontologia', 3, '⚽ Ter o artilheiro da série', 15],
  ['uomo', 'Uomo Concetto', 4, '🏆 Chegar na semi da Copa', 15],
  ['vadico', 'Vadico Veículos', 5, '🛡️ Não cair', 8],
]
const papel = ([k, nome, anos, meta, bonus]) => `<div class="papel">
  <small>CONTRATO MASTER</small>${L[k] ? `<img src="${L[k]}">` : ''}<b class="marca">${nome}</b><span class="anos">${anos} ${anos > 1 ? 'TEMPORADAS' : 'TEMPORADA'}</span>
  <div class="por"><strong>+${Math.round(base * mult[anos - 1])}</strong><em>por temporada</em></div>
  <div class="meta"><span>🎯 META DA MARCA</span><b>${meta}</b><i>bateu? +${bonus} 🪙 de bônus</i></div></div>`
const tela = (tag, cor, titulo, corpo) => `<div class="col"><div class="tag" style="background:${cor}">${tag}</div><div class="fone"><h2>${titulo}</h2>${corpo}</div></div>`

const t1 = tela('1 · ESCOLHER', '#1B7A3D', 'PATROCINADOR MASTER', `<p class="sub">Série B · cada marca paga por temporada e tem a SUA meta. Bateu a meta no ano, ganha bônus.</p>
  <div class="grade">${C.map(papel).join('')}</div>
  <p class="nota">As metas são sorteadas a cada contrato novo — não dá pra decorar.</p>`)

const t2 = tela('2 · FOI BEM', '#7C3AED', '📞 LIGAÇÃO DA MARCA', `<div class="carta"><div class="topo">${L.ero ? `<img src="${L.ero}">` : ''}<div><b>ERO Odontologia</b><small>fim do contrato · temporada 7</small></div></div>
  <p class="fala">“Presidente, que temporada! <b>Subiram pra Série A</b> com o artilheiro da série no elenco. A gente quer continuar com o Testador FC — e paga mais.”</p>
  <div class="oferta"><span>PROPOSTA DE RENOVAÇÃO</span><strong>+90 🪙 por temporada</strong><small>3 temporadas · nova meta: 🏅 terminar na metade de cima</small></div>
  <div class="bts"><button class="ok">✍️ RENOVAR</button><button>🔎 OUVIR O MERCADO</button></div>
  <p class="nota">Ouvir o mercado = abre as 5 propostas de sempre. Pode vir melhor… ou pior. A ERO não espera: se recusar, ela sai.</p></div>
  <p class="nota">Só liga quem foi bem: subiu, ganhou título ou bateu a meta.</p>`)

const t3 = tela('3 · CAIU', '#C2452F', '📰 O MARTELO', `<div class="jornal"><small>EDIÇÃO DA VIRADA · TEMPORADA 9</small>
  <h3>UOMO CONCETTO RESCINDE: “NÃO QUEREMOS NOSSO NOME NA SÉRIE C”</h3>
  <p>A grife italiana rasgou o contrato depois do rebaixamento do Testador FC. Pela cláusula, pagou a multa e foi embora sem olhar pra trás.</p>
  <div class="multa"><span>💸 MULTA PAGA AO CLUBE</span><strong>+44 🪙</strong><small>= 1 temporada do contrato</small></div></div>
  <div class="volta"><b>🔁 Seu clube volta pro mercado</b><span>Na virada, as 5 propostas aparecem de novo — agora com os valores da Série C.</span></div>
  <p class="nota">Contrato curto termina antes de você cair; o longo é o que corre o risco de ser rasgado.</p>`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}body{margin:0;background:#F4ECD6;font-family:Arial,sans-serif;color:#0C0C0C;padding:22px;width:1240px}
h1{font:700 30px Oswald;text-transform:uppercase;margin:0 0 4px}.lead{margin:0 0 16px;font-weight:700;color:#3a3a32;font-size:14px}
.wrap{display:flex;gap:20px;align-items:flex-start}.col{width:390px}
.tag{display:inline-block;color:#fff;font:700 15px Oswald;border:3px solid #0C0C0C;border-radius:10px;padding:3px 12px;margin-bottom:8px;box-shadow:3px 3px 0 #0C0C0C}
.fone{background:#16120d;color:#f6efdc;border:4px solid #0C0C0C;border-radius:24px;padding:14px;box-shadow:6px 6px 0 #0C0C0C;min-height:760px}
h2{font:700 22px Oswald;margin:0 0 4px;color:#FFC400}.sub{margin:0 0 10px;font-size:12px;font-weight:600;opacity:.85}
.grade{display:grid;grid-template-columns:1fr 1fr;gap:8px}.grade .papel:last-child{grid-column:1/-1}
.papel{background:#f6efdc;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:6px;box-shadow:3px 3px 0 rgba(0,0,0,.55);padding:7px 6px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px}
.papel small{font:700 7px Oswald;letter-spacing:.08em}.papel img{height:20px;max-width:70%;object-fit:contain}.marca{font:700 14px Oswald}.anos{font:700 10px Oswald;background:#0C0C0C;color:#FFC400;border-radius:5px;padding:1px 6px}
.por strong{font:700 22px Oswald;color:#1B7A3D;display:block;line-height:1;margin-top:3px}.por em{font-style:normal;font-size:9px;font-weight:700}
.meta{align-self:stretch;margin-top:4px;background:#fff3c4;border:2px dashed #b38600;border-radius:6px;padding:4px}.meta span{display:block;font:700 8px Oswald;letter-spacing:.06em;color:#7a5b00}.meta b{display:block;font:700 12px Oswald}.meta i{font-style:normal;font-size:10px;font-weight:700;color:#1B7A3D}
.nota{font-size:11px;font-weight:600;opacity:.75;margin:10px 2px 0;line-height:1.35}
.carta{background:#f6efdc;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:12px;padding:12px;box-shadow:4px 4px 0 #000}.carta .nota{opacity:.7}
.topo{display:flex;align-items:center;gap:10px}.topo img{height:34px}.topo b{font:700 18px Oswald;display:block}.topo small{font-size:11px;font-weight:700;opacity:.65}
.fala{font-size:14px;line-height:1.4;font-style:italic;margin:12px 0}
.oferta{background:#0C0C0C;color:#fff;border-radius:10px;padding:10px;text-align:center}.oferta span{display:block;font:700 10px Oswald;letter-spacing:.08em;color:#FFC400}.oferta strong{display:block;font:700 26px Oswald;color:#7CE39A}.oferta small{font-size:11px;font-weight:600;opacity:.85}
.bts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.bts button{font:700 14px Oswald;border:3px solid #0C0C0C;border-radius:10px;padding:10px 4px;background:#fff;box-shadow:3px 3px 0 #0C0C0C}.bts .ok{background:#FFC400}
.jornal{background:#fbf7ea;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:8px;padding:12px;font-family:Georgia,serif}.jornal small{font:700 10px Oswald;letter-spacing:.1em;opacity:.6}
.jornal h3{font:700 22px Oswald;line-height:1.1;margin:6px 0 8px;text-transform:uppercase}.jornal p{font-size:14px;line-height:1.45;margin:0 0 10px}
.multa{background:#E9F5EC;border:2px solid #1B7A3D;border-radius:8px;padding:8px;text-align:center;font-family:Arial}.multa span{display:block;font:700 10px Oswald;letter-spacing:.06em}.multa strong{display:block;font:700 26px Oswald;color:#1B7A3D}.multa small{font-size:11px;font-weight:700}
.volta{margin-top:12px;background:#f6efdc;color:#0C0C0C;border:3px solid #0C0C0C;border-radius:10px;padding:10px}.volta b{display:block;font:700 15px Oswald}.volta span{font-size:12px;font-weight:600}
</style></head><body><h1>🏆 Patrocinador Master com história</h1><p class="lead">Junção das ideias 1 + 2 + 3: cada contrato tem uma meta · quem vai bem recebe a ligação pra renovar · quem cai pode ser largado (com multa).</p>
<div class="wrap">${t1}${t2}${t3}</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 2 })
const tmp = resolve(tmpdir(), `mh-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp); await p.waitForTimeout(400); rmSync(tmp)
await p.screenshot({ path: 'scripts/mockups/master-historia.png', fullPage: true }); await b.close()
console.log('📸 scripts/mockups/master-historia.png', Object.keys(L))
