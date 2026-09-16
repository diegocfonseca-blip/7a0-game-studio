// 🎨 MOCKUP — AS 8 ARTES RENOVADAS DE 16/09 (pedido do Diego: *"faça o mockup com
// todas as novidades... tô falando dos clubes de artes"*).
//
// Um quadro só, com os 8 clubes que ganharam arte nova hoje: escudo, mascote e a
// camisa que o dono mandou, com as cores do manto MEDIDAS na camisa (nunca
// chutadas). Dois deles só trocaram escudo e manto — a mascote continua a mesma,
// por ordem do dono; isso vem escrito no card pra não parecer esquecimento.
//
// As camisas saem de `scripts/kits/` (são do POST, não entram no bundle do jogo).
// Rodar: node scripts/mockup-artes-16-09.mjs [saida.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'

const SAIDA = process.argv[2] || '/tmp/mockup-artes-16-09.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D'

const b64 = p => 'data:image/webp;base64,' + readFileSync(p).toString('base64')
const IMG = 'src/escalacao/img/', KIT = 'scripts/kits/'

// [chave, nome do clube, nome da mascote, cores do manto, coração, aviso]
const CLUBES = [
  ['murriz', 'Murriz FC', 'O Murriz', ['#C81D1C', '#150A0A'], 'Flamengo', ''],
  ['nightfull', 'Nightfull FC', 'O Nightfull', ['#0A0A0A', '#D6D2CF', '#C5A373'], 'Atlético-MG', ''],
  ['barcenite', 'Barcenite FC', 'O Gatão', ['#F2B010', '#013882'], '', ''],
  ['papao', 'Papão United Madrid', 'O Papão', ['#001A6C', '#D4D6DD', '#DC9D3B'], 'Paysandu', 'a mascote é a MESMA — o dono avisou que só o escudo e o manto mudaram'],
  ['scorporila', 'Scorporila FC', 'O Scorporila', ['#161516', '#E3DCD6', '#EDB228'], 'Santos', ''],
  ['saoluiz', 'São Luiz FC', 'Luizão', ['#C70107', '#080808', '#D9D9D8'], '', 'a mascote é a MESMA — trocaram só o escudo e o manto'],
  ['marolados', 'Marolados FC', 'O Marolado', ['#024623', '#F5EBD7', '#F7C617'], '', ''],
  ['marinheiros', 'Marinheiros AS', 'O Marujo', ['#0D4926', '#F5EBE1'], 'Palmeiras', ''],
]
const DIM = {
  murriz: [240, 316, 486], nightfull: [249, 244, 476], barcenite: [268, 222, 490],
  papao: [232, 281, 482], scorporila: [262, 249, 518], saoluiz: [360, 267, 522],
  marolados: [298, 230, 537], marinheiros: [290, 281, 507],
}
const H_ESC = 116, H_MAS = 150, H_CAM = 132

const card = ([k, nome, masc, cores, cor, aviso]) => {
  const [we, wm, wc] = DIM[k]
  return `<div class="cd">
    <div class="tp"><h3>${nome}</h3>${cor ? `<span class="cor">❤️ ${cor}</span>` : ''}</div>
    <div class="art">
      <figure><img src="${b64(IMG + k + '-escudo.webp')}" height="${H_ESC}" width="${Math.round(H_ESC * we / 360)}"><figcaption>escudo</figcaption></figure>
      <figure><img src="${b64(IMG + k + '-mascote.webp')}" height="${H_MAS}" width="${Math.round(H_MAS * wm / 440)}"><figcaption>${masc}</figcaption></figure>
      <figure><img src="${b64(KIT + k + '-camisa.webp')}" height="${H_CAM}" width="${Math.round(H_CAM * wc / 620)}"><figcaption>camisa do dono</figcaption></figure>
    </div>
    <div class="ft">
      <span class="lb">manto</span>
      <div class="man">${cores.map(c => `<i style="background:${c}"></i>`).join('')}</div>
      <span class="hx">${cores.join(' · ')}</span>
    </div>
    ${aviso ? `<div class="av">ℹ️ ${aviso}</div>` : ''}
  </div>`
}

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{background:${CREME};font-family:Oswald,system-ui;color:${INK};width:1180px;padding:28px}
  h1{font-size:46px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};
        padding:13px 17px;font-size:16px;font-weight:700;margin:14px 0 20px;line-height:1.4}
  .gr{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .cd{background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:14px 15px}
  .tp{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px}
  .tp h3{font-size:22px;font-weight:900;text-transform:uppercase;line-height:1}
  .cor{font-size:12px;font-weight:700;color:#888;white-space:nowrap}
  .art{display:flex;align-items:flex-end;justify-content:space-around;gap:8px;
       background:${CREME};border:2.5px solid ${INK};border-radius:12px;padding:10px 8px 6px;min-height:170px}
  .art figure{display:flex;flex-direction:column;align-items:center;gap:4px}
  .art img{display:block;object-fit:contain}
  .art figcaption{font-size:10.5px;font-weight:700;color:#8a8070;text-transform:uppercase;letter-spacing:.5px}
  .ft{display:flex;align-items:center;gap:9px;margin-top:9px}
  .lb{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#999}
  .man{display:flex;border:2.5px solid ${INK};border-radius:7px;overflow:hidden;height:20px}
  .man i{display:block;width:30px;height:100%}
  .hx{font-size:11px;font-weight:700;color:#aaa;letter-spacing:.3px}
  .av{margin-top:8px;background:#FFF6DA;border:2px solid ${INK};border-radius:9px;padding:6px 9px;
      font-size:12px;font-weight:700;line-height:1.35}
  .pe{margin-top:20px;background:#fff;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};
      padding:15px 17px;font-size:14.5px;font-weight:700;line-height:1.55}
  .pe b{color:${VERDE}}
</style>

<h1>8 CLUBES DE <span class="g">CARA NOVA</span></h1>
<div class="lead">Todas as artes que os donos mandaram hoje já estão no jogo: escudo, mascote e as
cores do manto. <b>As cores foram MEDIDAS na camisa de cada um</b> — nenhuma foi chutada.</div>

<div class="gr">${CLUBES.map(card).join('')}</div>

<div class="pe">
  🛡️ <b>Nada foi inventado.</b> Toda peça saiu da prancha que o próprio dono mandou — quando ele disse
  que a mascote não mudava, ela não mudou.<br>
  🎽 <b>A camisa é do post, não do jogo.</b> Dentro do jogo o manto é listra desenhada (não pesa nada);
  a camisa aqui é só pra você conferir de onde saíram as cores.<br>
  📏 <b>Tudo dentro do peso.</b> Escudo até 30 KB, mascote até 45 KB — quem nunca cruzar com o clube
  nem baixa a arte dele.<br>
  ↩️ <b>Dá pra voltar atrás:</b> cada clube foi um commit separado, então dá pra desfazer um sem
  mexer nos outros sete.
</div>
`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1180, height: 1400 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
