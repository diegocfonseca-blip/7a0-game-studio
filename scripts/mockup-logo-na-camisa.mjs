// 🖼️ MOCKUP — dar CONTRASTE pro logo do Patrocinador Master na camisa listrada.
//
// Diego, 15/09, com o zoom da camisa do Futpoint FC: *"a logo N tá ficando MT legal..
// acho q falta algum fundo pra dar um contraste na logo não sei.. Mas teria q ser algo
// bem natural como se fosse silk na camisa msm.. E N PowerPoint hehe... Lembrando q
// muda a logo qd troca o patrocinador Master né"*.
//
// O DIAGNÓSTICO (medido, não achismo — ver o número que o mockup imprime):
// `brilhoNoPonto()` em `loja-tela.tsx` mede UM quadradinho de 40×40 do pano e decide
// o halo do logo por ele. Numa camisa LISA isso funciona. Na listrada não: a média dá
// "meio-termo", e o logo acaba passando por cima de preto E de branco ao mesmo tempo —
// a parte escura do logo some no preto e a clara some no branco. O halo único não
// resolve, porque o problema não é o brilho médio, é a VARIAÇÃO.
//
// ⚠️ E o que vier tem que servir pras QUATRO marcas (Max Joias · Rei das Tintas · ERO ·
// Vadico) e pro caso sem logo (nome impresso), porque a estampa troca junto com o
// Patrocinador Master — nada pode ser feito à mão pra uma marca só.
//
// Rodar: node scripts/mockup-logo-na-camisa.mjs [saida.png]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64 = (p, t = 'image/webp') => `data:${t};base64,${readFileSync(p).toString('base64')}`
const CAMISA = b64('scripts/kits/futpoint-camisa.webp')
const VADICO = b64('src/escalacao/img/patro-vadico-alfa.webp')

const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'
const ALT = 420 // altura da camisa no mockup (no jogo ela varia; a proporção é a mesma)

// os quatro tratamentos. `cls` vira a classe do <img> do logo; `antes` é o que entra ATRÁS.
const CASOS = [
  { id: 'hoje', t: 'Como está hoje', cor: '#E8E2CE', ink: INK,
    nota: 'Só o halo branco em volta. Na parte <b>branca</b> da listra o halo não serve pra nada — e o cinza do "VEÍCULOS" some.' },
  { id: 'tarja', t: 'A · tarja de silk', cor: VERDE, ink: '#fff',
    nota: 'Um <b>retângulo liso</b> impresso atrás, na cor do próprio manto, com a sombra do tecido por cima. É o que clube listrado de verdade faz.' },
  { id: 'base', t: 'B · base branca', cor: '#7C3AED', ink: '#fff',
    nota: 'Sem retângulo: uma <b>base branca no formato do logo</b>, igual à sub-base que a serigrafia imprime antes da cor.' },
  { id: 'faixa', t: 'C · faixa na barriga', cor: '#2F6BAE', ink: '#fff',
    nota: 'Uma <b>faixa horizontal</b> atravessando as listras, de ponta a ponta. Mais chamativa — e mexe no desenho do manto.' },
]

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
 *{box-sizing:border-box}
 body{margin:0;background:#e9e1c9;font-family:system-ui;color:${INK};width:1560px;padding:28px}
 h1{font-family:Oswald;font-size:33px;margin:0 0 4px;text-transform:uppercase}
 p.sub{font-size:16.5px;color:#4a4636;margin:0 0 6px;line-height:1.5;max-width:1400px}
 .medida{font-size:14px;font-weight:800;color:#8a2318;background:#FDECEA;border:2.5px dashed ${VERM};
   border-radius:10px;padding:8px 12px;margin:0 0 20px;display:inline-block}
 .grid{display:flex;gap:16px;align-items:flex-start}
 .col{flex:1}
 .ct{font-family:Oswald;font-weight:900;font-size:15px;text-transform:uppercase;padding:8px 12px;
   border:4px solid ${INK};border-radius:14px 14px 0 0;border-bottom:0}
 .tela{background:#1a1712;border:4px solid ${INK};border-radius:0 0 14px 14px;padding:10px;
   box-shadow:5px 5px 0 ${INK};display:flex;justify-content:center}
 .lg{font-size:13px;font-weight:700;color:#4a4636;line-height:1.45;margin:9px 3px 0}

 .palco{position:relative;height:${ALT}px;isolation:isolate}
 .palco>img.camisa{height:${ALT}px;display:block}
 .marca{position:absolute;left:50%;transform:translate(-50%,-50%)}
 .logo{display:block;width:auto;height:auto;max-width:${ALT * 0.20}px;max-height:${ALT * 0.155}px}

 /* HOJE — o halo claro de sempre */
 .hoje .logo{filter:drop-shadow(0 0 2px rgba(255,255,255,.75)) drop-shadow(0 0 5px rgba(255,255,255,.35))}

 /* A — tarja lisa atrás, com a sombra do tecido por cima */
 .tarja .plate{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:6px}
 .tarja .logo{filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}

 /* B — base branca no formato do logo (sub-base de serigrafia) */
 .base .logo{filter:drop-shadow(0 0 1.2px #fff) drop-shadow(0 0 1.2px #fff) drop-shadow(0 0 1.2px #fff)
   drop-shadow(0 0 1.2px #fff) drop-shadow(0 0 3px rgba(0,0,0,.35))}

 /* C — faixa de ponta a ponta */
 .faixa .band{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}
 .faixa .logo{filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}

 .zoom{margin-top:9px;border:3px solid ${INK};border-radius:11px;overflow:hidden;height:118px;background:#000}
 .zoom>div{width:100%;height:100%;background-repeat:no-repeat}
 .zl{font:900 9px Oswald;letter-spacing:1px;color:#8a8266;margin:8px 3px 3px;text-transform:uppercase}

 .nota{margin-top:22px;background:#FFF4E2;border:4px solid #B8722A;border-radius:15px;padding:16px 20px;
   font-size:15.5px;line-height:1.55;color:#3A2C18}
 .nota b{font-weight:800}
</style>
<h1>👕 O logo do Master sumindo nas listras</h1>
<p class="sub">Você está certo: hoje a camisa mede <b>um pontinho</b> do pano pra decidir o brilho do halo. Em camisa lisa dá certo; na <b>listrada</b> a conta dá "meio-termo" e o logo acaba metade no preto, metade no branco — e some dos dois lados. Três jeitos de resolver, todos automáticos (a estampa troca junto com o Master):</p>
<p class="medida" id="medida">medindo o pano…</p>
<div class="grid">
${CASOS.map(c => `
  <div class="col">
    <div class="ct" style="background:${c.cor};color:${c.ink}">${c.t}</div>
    <div class="tela">
      <div class="palco ${c.id}" id="p-${c.id}">
        <img class="camisa" src="${CAMISA}">
        ${c.id === 'faixa' ? '<div class="band"></div>' : ''}
        <div class="marca">${c.id === 'tarja' ? '<div class="plate"></div>' : ''}<img class="logo" src="${VADICO}"></div>
      </div>
    </div>
    <p class="zl">zoom 3× no logo</p>
    <div class="zoom"><div id="z-${c.id}"></div></div>
    <p class="lg">${c.nota}</p>
  </div>`).join('')}
</div>
<div class="nota" id="nota"></div>

<script>
// o ZOOM é tirado pelo Playwright (recorte da tela DE VERDADE, com o logo em cima) —
// fazer por background só mostrava o tecido, sem a estampa: mentia pro olho.
window.__caixas = () => [...document.querySelectorAll('.palco')].map(el => {
  const mk = el.querySelector('.marca').getBoundingClientRect()
  return { id: el.id.replace('p-', ''), x: mk.left + mk.width / 2, y: mk.top + mk.height / 2 }
})
// ── posiciona o logo exatamente onde o jogo põe (POS_BATISMO + fatorCamisa) ──
const POS = { masterX: 50, masterY: 62 }, PROP_SO_CAMISA = 0.80
function posiciona() {
  document.querySelectorAll('.palco').forEach(p => {
    const img = p.querySelector('img.camisa')
    const fc = Math.min(1, (img.naturalWidth / img.naturalHeight) / PROP_SO_CAMISA)
    p.querySelector('.marca').style.left = POS.masterX + '%'
    p.querySelector('.marca').style.top = (POS.masterY * fc) + '%'
    const band = p.querySelector('.band'); if (band) band.style.top = (POS.masterY * fc) + '%'
  })
}
// ── mede o pano ATRÁS do logo: brilho médio, variação (= listra) e a cor dominante ──
function medePano() {
  const img = document.querySelector('#p-hoje img.camisa')
  const fc = Math.min(1, (img.naturalWidth / img.naturalHeight) / PROP_SO_CAMISA)
  const cv = document.createElement('canvas'), W = img.naturalWidth, H = img.naturalHeight
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0)
  // a janela do logo, nas coordenadas do arquivo
  const lw = Math.round(W * 0.34), lh = Math.round(H * 0.10)
  const cx = Math.round(W * POS.masterX / 100), cy = Math.round(H * POS.masterY * fc / 100)
  const d = ctx.getImageData(cx - lw / 2, cy - lh / 2, lw, lh).data
  const lums = [], cont = {}
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 120) continue
    lums.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
    const q = (v) => Math.round(v / 24) * 24
    const k = q(d[i]) + ',' + q(d[i + 1]) + ',' + q(d[i + 2])
    cont[k] = (cont[k] || 0) + 1
  }
  const med = lums.reduce((a, b) => a + b, 0) / lums.length
  const dp = Math.sqrt(lums.reduce((a, b) => a + (b - med) ** 2, 0) / lums.length)
  const claros = lums.filter(l => l > 150).length / lums.length
  // cor dominante ESCURA (é nela que a tarja é impressa — nunca inventada)
  const dom = Object.entries(cont).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => ({ rgb: k.split(',').map(Number), n }))
    .filter(x => 0.299 * x.rgb[0] + 0.587 * x.rgb[1] + 0.114 * x.rgb[2] < 110)[0]
  const cor = dom ? 'rgb(' + dom.rgb.join(',') + ')' : '#1a1a1a'
  return { med, dp, claros, cor }
}
const arranca = () => {
  posiciona()
  const m = medePano()
  const listrado = m.dp > 45
  document.getElementById('medida').innerHTML =
    '📏 Medido no pano atrás do logo desta camisa: brilho médio <b>' + m.med.toFixed(0) + '</b> (parece meio-termo), ' +
    'mas a variação é <b>' + m.dp.toFixed(0) + '</b> e <b>' + (m.claros * 100).toFixed(0) + '%</b> dos pixels são claros — ' +
    'ou seja, <b>' + (listrado ? 'É LISTRADO' : 'é liso') + '</b>. É por isso que um halo só nunca resolve.'
  // aplica a cor MEDIDA (nada chutado)
  document.querySelectorAll('.tarja .plate').forEach(el => {
    const logo = el.parentElement.querySelector('.logo')
    el.style.width = (logo.offsetWidth + 18) + 'px'
    el.style.height = (logo.offsetHeight + 12) + 'px'
    el.style.background = m.cor
    el.style.boxShadow = 'inset 0 0 8px rgba(0,0,0,.35)'
    el.style.opacity = '.93'
  })
  document.querySelectorAll('.faixa .band').forEach(el => {
    const logo = el.parentElement.querySelector('.logo')
    el.style.height = (logo.offsetHeight + 14) + 'px'
    el.style.background = m.cor
    el.style.opacity = '.9'
  })
    document.getElementById('nota').innerHTML =
      '<b>✅ O Diego escolheu a B (base branca), 15/09:</b> <i>"B base branca ficou melhor"</i>. ' +
      'É a mais "serigrafia de verdade": a sub-base branca é exatamente o que a máquina imprime ANTES da cor, ' +
      'pra tinta não ser comida pelo tecido. E é a única que <b>não põe nada retangular</b> na camisa — ' +
      'o contorno segue o formato do logo, então não vira caixa colada.<br>' +
      '· Eu tinha sugerido a <b>A</b> e ele preferiu a B olhando o resultado. Fica registrado: <b>nada de tarja retangular</b> ' +
      'na camisa sem ele pedir.<br>' +
      '· A <b>C</b> mexeria no desenho do manto — e manto de batismo é arte de uma pessoa de verdade. Fora.<br>' +
      '<b>A trava que vai junto:</b> a base só é aplicada quando o pano embaixo é <b>listrado de verdade</b> ' +
      '(a variação de brilho passar do limite). Em camisa lisa nada muda. Vale pras quatro marcas e pro caso sem logo, ' +
      'porque a conta é do PANO, não da marca — e a estampa troca junto com o Patrocinador Master.<br>' +
      '<b>Dá pra voltar atrás?</b> Sim: é um bloco em <code>loja-tela.tsx</code>. Nada de save, nada de banco, e nenhuma arte de batismo é alterada.'
    window.__pronto = 1
}
if (document.readyState === 'complete') arranca(); else window.addEventListener('load', arranca)
</script>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
p.on('console', m => console.log('[page]', m.type(), m.text()))
p.on('pageerror', e => console.log('[pageerror]', e.message))
await p.setContent(html, { waitUntil: 'networkidle' })
await p.waitForFunction(() => window.__pronto === 1)
// ── ZOOM DE VERDADE: recorta a tela renderizada (tecido + estampa) e devolve ampliado
const LARG = 130, ALTU = 42 // janela em px de tela; vira 3× dentro da caixa do zoom
for (const c of await p.evaluate(() => window.__caixas())) {
  const png = await p.screenshot({ clip: { x: c.x - LARG / 2, y: c.y - ALTU / 2, width: LARG, height: ALTU } })
  await p.evaluate(([id, b64]) => {
    const z = document.getElementById('z-' + id)
    z.style.background = `url(data:image/png;base64,${b64}) center/cover no-repeat`
    z.style.imageRendering = 'auto'
  }, [c.id, png.toString('base64')])
}
await p.screenshot({ path: process.argv[2] ?? 'mockup-logo-na-camisa.png', fullPage: true })
await b.close()
console.log('ok')
