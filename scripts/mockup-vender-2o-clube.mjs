// 🖼️ MOCKUP — VENDER O 2º CLUBE (pedido do Diego 14/09: *"gostaria de dar opção
// pra quem comprou o segundo clube poder vender… aí quando vender some também as
// coisas de trocar, hibernar e etc e mantém tudo como era antes"*).
//
// 💰 O VALOR (2ª volta): ele recusou vender pelo mesmo preço — *"vender pelo msm
// valor n sei se é válido.. podia deixar vender mas perdendo um cadinho, pelo
// menos 300 moedas"*. Então: paga 4.000, recebe 3.700.
//
// 🍖 A HISTORINHA (3ª volta): depois de duas levas recusadas, ele escreveu a dele —
// *"coloque q os jogadores e diretoria fizeram churrasco de despedida comemorando
// sua saída e pior deixaram na sua conta"*. É esse texto que está aqui.
//
// Rodar: node scripts/mockup-vender-2o-clube.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-vender-2o-clube.png')
const INK = '#0C0C0C', CREME = '#F4ECD6', OURO = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F'

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;background:${CREME};font-family:Oswald,system-ui;color:${INK};padding:26px;width:1180px}
  h1{font-size:34px;margin:0 0 2px;text-transform:uppercase;letter-spacing:.5px}
  p.sub{margin:0 0 20px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.4;max-width:940px}
  .cols{display:flex;gap:18px;align-items:flex-start}
  .col{flex:1}
  .rot{font-size:15px;text-transform:uppercase;letter-spacing:1px;font-weight:900;margin:0 0 8px;display:flex;gap:8px;align-items:center}
  .rot i{font-style:normal;background:${INK};color:${CREME};border-radius:20px;padding:2px 10px;font-size:12px}
  .tel{background:${CREME};border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:14px;min-height:400px}
  .card{background:${INK};color:${CREME};border-radius:14px;padding:12px;margin-bottom:12px}
  .card h3{margin:0 0 10px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:${OURO}}
  .chips{display:flex;gap:8px;margin-bottom:10px}
  .chip{flex:1;background:#221f18;border:3px solid #4a4436;border-radius:11px;padding:8px;text-align:center;font-size:13px;line-height:1.3}
  .chip.on{border-color:${OURO};background:#2e2a1c}
  .chip b{display:block;font-size:15px}
  .chip small{opacity:.75;font-size:11px}
  .btn{display:block;width:100%;text-align:center;border:3px solid ${INK};border-radius:12px;padding:10px;font-weight:900;
       font-size:15px;text-transform:uppercase;box-shadow:3px 3px 0 ${INK};margin-bottom:9px}
  .btn.tr{background:${OURO};color:${INK}}
  .btn.vd{background:${VERM};color:#fff}
  .btn.cz{background:#cfc6ab;color:#4a4636}
  .leg{font-family:system-ui;font-size:12px;opacity:.8;line-height:1.4;margin:0}
  .box{background:#fff;border:4px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};padding:13px;margin-bottom:12px}
  .box h4{margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.6px}
  .box p{margin:0;font-family:system-ui;font-size:13px;line-height:1.45;color:#333}
  .sumiu{opacity:.32;position:relative}
  .sumiu:after{content:'SOME';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-weight:900;font-size:26px;letter-spacing:4px;color:${VERM};background:rgba(244,236,214,.55);border-radius:14px}
  .modal{background:#fff;border:4px solid ${INK};border-radius:18px;box-shadow:6px 6px 0 ${INK};padding:16px}
  .modal h2{margin:0 0 10px;font-size:23px;text-transform:uppercase}
  .modal ul{margin:8px 0 12px;padding-left:18px;font-family:system-ui;font-size:13.5px;line-height:1.6;color:#2f2c22}
  .churras{background:#fff4e2;border:3px solid #b8722a;border-radius:13px;padding:11px 12px;margin-bottom:11px}
  .churras p{margin:0;font-family:system-ui;font-size:14px;line-height:1.5;color:#3a2c18}
  .churras .pe{margin-top:7px;font-family:Georgia,serif;font-style:italic;font-size:13.5px;color:#6b4a22}
  .ok{background:#eafaef;border:3px solid ${VERDE};border-radius:12px;padding:9px 11px;font-family:system-ui;
      font-size:13.5px;line-height:1.45;margin-bottom:11px}
  .row{display:flex;gap:9px}
  .row .btn{margin:0}
  .extrato{background:${INK};color:${CREME};border-radius:12px;padding:11px 13px;font-family:system-ui;font-size:13px}
  .extrato b{color:${OURO}}
  .extrato .li{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #4a4436}
  .extrato .li:last-child{border:0}
  .neg{color:#ff8b7a} .pos{color:#7de29a}
  .nota{margin-top:16px;font-family:system-ui;font-size:13.5px;line-height:1.5;color:#2f2c22;background:#fff7d6;
        border:3px solid ${INK};border-radius:14px;padding:11px 13px;box-shadow:3px 3px 0 ${INK}}
</style>
<h1>Vender o 2º clube · versão final</h1>
<p class="sub">Paga 4.000, recebe <b>3.700</b>. Os 300 são o churrasco que eles fizeram sem te chamar. O clube volta a ser um time da máquina na divisão em que estiver — não some do jogo e não mexe na contagem da pirâmide.</p>

<div class="cols">
  <div class="col">
    <p class="rot">Aba Clube <i>o botão novo</i></p>
    <div class="tel">
      <div class="card">
        <h3>🏛️ Multiclubes — quem você comanda?</h3>
        <div class="chips">
          <div class="chip on"><b>🟡 Meia na Canela</b><small>no comando</small></div>
          <div class="chip"><b>⚪ Adão Esporte</b><small>dormindo 💤</small></div>
        </div>
        <div class="btn tr">🔄 Passar o comando pro Adão Esporte</div>
        <div class="btn vd">💸 Vender o Adão Esporte · 3.700 🪙</div>
        <p class="leg">Só dá pra vender o clube que está <b>dormindo</b>. Pra vender o outro, passa o comando antes.</p>
      </div>
      <div class="box"><h4>🏟️ Estádio</h4><p>Obras, lotação e patrocínio do clube no comando.</p></div>
    </div>
  </div>

  <div class="col" style="flex:1.35">
    <p class="rot">O aviso antes de confirmar <i>o churrasco</i></p>
    <div class="modal">
      <h2>💸 Vender o Adão Esporte?</h2>
      <div class="churras">
        <p>🍖 <b>O elenco e a diretoria já fizeram o churrasco de despedida</b> — comemorando a sua saída. E deixaram os <b>300 🪙</b> na sua conta.</p>
        <p class="pe">“Teve faixa, teve discurso, teve foto no gramado. Só não te chamaram.”</p>
      </div>
      <div class="ok">✅ Você pagou 4.000 e recebe <b>3.700 🪙</b> de volta.</div>
      <p style="font-family:system-ui;font-size:13.5px;margin:0 0 4px"><b>E o Adão Esporte:</b></p>
      <ul>
        <li><b>Continua no jogo</b>, na divisão em que está, comandado pela máquina.</li>
        <li>Fica com o <b>estádio, os títulos e o caixa dele</b>.</li>
        <li>Você <b>deixa de receber</b> a cota de TV e os prêmios dele.</li>
        <li>Os <b>empréstimos da SAF</b> que ele tem voltam antes da venda.</li>
      </ul>
      <div class="row"><div class="btn cz">Voltar</div><div class="btn vd">💸 Vender · 3.700 🪙</div></div>
    </div>
  </div>

  <div class="col">
    <p class="rot">Depois <i>volta ao normal</i></p>
    <div class="tel">
      <div class="card sumiu">
        <h3>🏛️ Multiclubes</h3>
        <div class="chips"><div class="chip on"><b>&nbsp;</b><small>&nbsp;</small></div><div class="chip"><b>&nbsp;</b><small>&nbsp;</small></div></div>
        <div class="btn tr">&nbsp;</div>
      </div>
      <div class="box"><h4>🏛️ Quer um 2º clube?</h4><p>O painel de <b>comprar</b> volta, igual antes. Dá pra comprar outro quando quiser.</p></div>
      <p class="rot" style="margin-top:14px">No extrato <i>fica registrado</i></p>
      <div class="extrato">
        <div class="li"><span>🏛️ Venda do 2º clube · Adão Esporte</span><b class="pos">+4.000</b></div>
        <div class="li"><span>🍖 Churrasco de despedida</span><b class="neg">−300</b></div>
      </div>
    </div>
  </div>
</div>

<div class="nota"><b>A única coisa que ainda não te perguntei de volta:</b> as cartas de empresário que estavam guardadas no clube que dormia. Meu palpite é que <b>vão junto com ele</b>, pela mesma lógica do estádio, dos títulos e do caixa: era o acervo daquele clube, não o seu. Se você achar que devem voltar pro seu bolso, é uma linha pra trocar.</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 1000 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
