// ─── 📢🔨 AVISO DA COMUNIDADE DO WHATSAPP = "O MARTELO, edição da comunidade" (Diego 12/10) ───
// Pedido: *"avisos novos igual o jogo Brasileirinho FC faz, porém com as nossas artes"*.
// 1ª versão copiou demais (data + título + etiquetas em pílula) e ele cortou: *"ficou muito
// igual… até os botões do Brasileirinho. Quero também personalidade. Faz o que acha melhor"*.
// Então o aviso virou o JORNAL DO JOGO: O MARTELO (o mesmo jornal do fim de temporada e da
// carta-convite), com a cara de leilão que é a nossa:
//   • cabeçalho de jornal (nome com fio duplo, edição, data, preço "1 🪙")
//   • chamada vermelha + MANCHETE + linha fina
//   • foto com CARIMBO torto ("BATIZADO!", "NOVIDADE!", "VENDIDO!")
//   • as novidades viram LOTES do pregão (LOTE 01, 02… com o martelinho), não etiquetas
//   • rodapé de CLASSIFICADOS com zoeira (é ali que mora a chamada pra ação)
// Mora no repo pra não se perder (lição do mockup do Coringas, que sumiu com o scratchpad).
//
// uso (da RAIZ do repo): node scripts/aviso-comunidade.mjs scripts/avisos/<arquivo>.json
// {
//   "edicao": 1, "data": "12 de outubro de 2026",
//   "chamada": "Batismo de Lenda", "manchete": "Nasceu o Inter Vale FC", "linhaFina": "…",
//   "carimbo": "Batizado!",                                         ← opcional
//   "foto": { "escudo": "…webp", "mascote": "…webp", "camisa": "…webp", "legenda": "…" },  ← opcional
//   "lotes": [ { "titulo": "…", "texto": "… **negrito** …" } ],
//   "classificado": { "titulo": "Vende-se", "texto": "…" },        ← opcional
//   "saida": "scripts/posts/aviso-xxx.png"
// }
// 🚫 Valem aqui também: BUG NUNCA VIRA AVISO (16/08) e post de batismo NÃO diz de quem era a vaga (05/09).
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const spec = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const url = p => 'file://' + resolve(p)
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
const f = spec.foto
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Osw;font-weight:700;src:url(${url('scripts/fonts/oswald-latin-700-normal.woff2')})}
@font-face{font-family:Osw;font-weight:500;src:url(${url('scripts/fonts/oswald-latin-500-normal.woff2')})}
*{box-sizing:border-box}
body{margin:0;width:1080px;background:#0C0C0C;font-family:Georgia,'Times New Roman',serif;color:#0C0C0C}
.mesa{padding:44px 40px 40px;background:radial-gradient(circle at 50% 0,#2a2a2a,#0C0C0C 70%)}
.papel{position:relative;background:#F4ECD6;border:5px solid #000;border-radius:10px;box-shadow:12px 12px 0 #FFC400;padding:30px 40px 34px;transform:rotate(-.6deg)}
.papel:before{content:"";position:absolute;inset:0;border-radius:6px;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.025) 0 2px,transparent 2px 5px)}
.topo{display:flex;justify-content:space-between;font:500 19px Osw;letter-spacing:.12em;text-transform:uppercase;color:rgba(0,0,0,.6)}
.nome{text-align:center;font:700 128px/1 Osw;letter-spacing:.02em;margin:6px 0 0}
.nome span{display:inline-block;transform:rotate(-18deg) translateY(-8px);font-size:84px;margin-right:6px}
.fio{border-top:4px solid #000;border-bottom:4px solid #000;height:12px;margin:8px 0 0}
.sub{display:flex;justify-content:space-between;font:700 19px Osw;letter-spacing:.14em;text-transform:uppercase;padding:8px 2px;border-bottom:2px solid #000}
.cham{display:inline-block;margin-top:26px;background:#C2452F;color:#fff;font:700 24px Osw;letter-spacing:.16em;text-transform:uppercase;padding:4px 14px;border:3px solid #000;box-shadow:3px 3px 0 #000}
h1{margin:12px 0 0;font:700 84px/.98 Osw;text-transform:uppercase}
.fina{margin:12px 0 0;font-size:29px;line-height:1.35;font-style:italic;color:rgba(0,0,0,.78)}
.foto{position:relative;margin-top:26px;border:4px solid #000;background:#0C0C0C;
  background-image:radial-gradient(circle at 50% 120%,rgba(255,196,0,.55),transparent 60%),repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 2px,transparent 2px 22px);
  display:flex;align-items:flex-end;justify-content:space-around;padding:28px 16px 18px;box-shadow:6px 6px 0 #000}
.foto img{display:block;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5))}
.carimbo{position:absolute;right:26px;top:22px;transform:rotate(12deg);border:6px solid #E8503A;color:#E8503A;border-radius:12px;
  font:700 54px/1 Osw;letter-spacing:.06em;text-transform:uppercase;padding:6px 16px;background:rgba(12,12,12,.55)}
.leg{font-size:20px;font-style:italic;color:rgba(0,0,0,.6);margin-top:10px;text-align:right}
.lotes{margin-top:24px;border-top:4px solid #000}
.lote{display:flex;gap:22px;padding:18px 0;border-bottom:2px dashed rgba(0,0,0,.35)}
.num{flex:none;width:118px;text-align:center}
.num b{display:block;font:700 18px Osw;letter-spacing:.2em;color:rgba(0,0,0,.55)}
.num i{display:block;font:700 54px/1 Osw;font-style:normal}
.num u{display:block;text-decoration:none;font-size:30px;margin-top:2px}
.lt h3{margin:2px 0 4px;font:700 34px/1.05 Osw;text-transform:uppercase}
.lt p{margin:0;font-size:27px;line-height:1.38}.lt p b{font-weight:700}
.clas{margin-top:26px;border:4px double #000;outline:3px solid #000;outline-offset:4px;padding:16px 22px;background:#FFF8E1}
.clas .t{font:700 19px Osw;letter-spacing:.3em;text-transform:uppercase;text-align:center;border-bottom:2px solid #000;padding-bottom:6px}
.clas h4{margin:10px 0 2px;font:700 40px/1 Osw;text-transform:uppercase}
.clas p{margin:4px 0 0;font-size:25px;line-height:1.35}
.pe{display:flex;justify-content:space-between;align-items:center;margin-top:22px;color:#F4ECD6;font:700 24px Osw;letter-spacing:.08em}
.pe span{color:#FFC400}
</style></head><body><div class="mesa"><div class="papel">
<div class="topo"><span>Edição da comunidade · nº ${esc(spec.edicao ?? 1)}</span><span>${esc(spec.data)}</span></div>
<div class="nome"><span>🔨</span> O MARTELO</div>
<div class="fio"></div>
<div class="sub"><span>⚽ Leilão Legends</span><span>Quem dá mais? · 1 🪙</span></div>
${spec.chamada ? `<div class="cham">${esc(spec.chamada)}</div>` : ''}
<h1>${esc(spec.manchete)}</h1>
${spec.linhaFina ? `<p class="fina">${esc(spec.linhaFina)}</p>` : ''}
${f ? `<div class="foto">
  ${f.escudo ? `<img src="${url(f.escudo)}" style="height:220px">` : ''}
  ${f.mascote ? `<img src="${url(f.mascote)}" style="height:330px">` : ''}
  ${f.camisa ? `<img src="${url(f.camisa)}" style="height:240px">` : ''}
  ${spec.carimbo ? `<div class="carimbo">${esc(spec.carimbo)}</div>` : ''}
</div>${f.legenda ? `<div class="leg">${esc(f.legenda)}</div>` : ''}` : ''}
<div class="lotes">${(spec.lotes ?? []).map((l, i) => `<div class="lote"><div class="num"><b>LOTE</b><i>${String(i + 1).padStart(2, '0')}</i><u>🔨</u></div><div class="lt"><h3>${esc(l.titulo)}</h3><p>${esc(l.texto)}</p></div></div>`).join('')}</div>
${spec.classificado ? `<div class="clas"><div class="t">Classificados</div><h4>${esc(spec.classificado.titulo)}</h4><p>${esc(spec.classificado.texto)}</p></div>` : ''}
</div>
<div class="pe"><span>🔨 Leilão Legends</span><div>leilaolegends.com</div></div>
</div></body></html>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
// a página vai pra um ARQUIVO: aberta em branco (setContent) o navegador bloqueia as imagens e a fonte locais
const tmp = resolve(tmpdir(), `aviso-${process.pid}.html`); writeFileSync(tmp, html)
await p.goto('file://' + tmp, { waitUntil: 'load' }); await p.waitForTimeout(600); rmSync(tmp)
await p.screenshot({ path: spec.saida, fullPage: true }); await b.close()
console.log('📢🔨', spec.saida)
