// 🖼️ MOCKUP — VENDER O 2º CLUBE (pedido do Diego 14/09: *"gostaria de dar opção
// pra quem comprou o segundo clube poder vender… aí quando vender some também as
// coisas de trocar, hibernar e etc e mantém tudo como era antes. E valor do
// segundo clube, coloca perdendo nada, vendendo pelo mesmo valor que foi comprado"*).
//
// Mostra a aba Clube ANTES e DEPOIS, mais o aviso de confirmação. Nada aqui é
// código do jogo — é só a proposta visual pro Diego aprovar antes de eu codar.
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
  p.sub{margin:0 0 20px;font-size:15px;color:#4a4636;font-family:system-ui;line-height:1.4;max-width:900px}
  .cols{display:flex;gap:18px;align-items:flex-start}
  .col{flex:1}
  .rot{font-size:15px;text-transform:uppercase;letter-spacing:1px;font-weight:900;margin:0 0 8px;display:flex;gap:8px;align-items:center}
  .rot i{font-style:normal;background:${INK};color:${CREME};border-radius:20px;padding:2px 10px;font-size:12px}
  .tel{background:${CREME};border:4px solid ${INK};border-radius:18px;box-shadow:5px 5px 0 ${INK};padding:14px;min-height:420px}
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
  .modal h2{margin:0 0 8px;font-size:22px;text-transform:uppercase}
  .modal ul{margin:8px 0 12px;padding-left:18px;font-family:system-ui;font-size:13.5px;line-height:1.6;color:#2f2c22}
  .modal li b{font-weight:700}
  .ok{background:#eafaef;border:3px solid ${VERDE};border-radius:12px;padding:9px 11px;font-family:system-ui;
      font-size:13.5px;line-height:1.45;margin-bottom:10px}
  .row{display:flex;gap:9px}
  .row .btn{margin:0}
  .nota{margin-top:16px;font-family:system-ui;font-size:13.5px;line-height:1.5;color:#2f2c22;background:#fff7d6;
        border:3px solid ${INK};border-radius:14px;padding:11px 13px;box-shadow:3px 3px 0 ${INK}}
  .nota b{font-weight:700}
</style>
<h1>Vender o 2º clube</h1>
<p class="sub">Proposta pra sua aprovação. A venda devolve <b>as mesmas 4.000 🪙</b> que você pagou, e o clube volta a ser um time da máquina na Série D — sem sumir do jogo e sem mexer na contagem de times da pirâmide.</p>

<div class="cols">
  <div class="col">
    <p class="rot">Aba Clube · hoje <i>como é</i></p>
    <div class="tel">
      <div class="card">
        <h3>🏛️ Multiclubes — quem você comanda?</h3>
        <div class="chips">
          <div class="chip on"><b>🟡 Meia na Canela</b><small>no comando</small></div>
          <div class="chip"><b>⚪ Adão Esporte</b><small>dormindo 💤</small></div>
        </div>
        <div class="btn tr">🔄 Passar o comando pro Adão Esporte</div>
        <p class="leg">O leilão é de um clube só: o que está no comando.</p>
      </div>
      <div class="box"><h4>🏟️ Estádio</h4><p>Obras, lotação e patrocínio do clube no comando.</p></div>
    </div>
  </div>

  <div class="col">
    <p class="rot">Aba Clube · proposta <i>mudança</i></p>
    <div class="tel">
      <div class="card">
        <h3>🏛️ Multiclubes — quem você comanda?</h3>
        <div class="chips">
          <div class="chip on"><b>🟡 Meia na Canela</b><small>no comando</small></div>
          <div class="chip"><b>⚪ Adão Esporte</b><small>dormindo 💤</small></div>
        </div>
        <div class="btn tr">🔄 Passar o comando pro Adão Esporte</div>
        <div class="btn vd">💸 Vender o Adão Esporte · 4.000 🪙</div>
        <p class="leg">Vende pelo mesmo valor que você pagou. Só dá pra vender o clube que está <b>dormindo</b>.</p>
      </div>
      <div class="box"><h4>🏟️ Estádio</h4><p>Obras, lotação e patrocínio do clube no comando.</p></div>
    </div>
  </div>

  <div class="col">
    <p class="rot">Depois de vender <i>volta ao normal</i></p>
    <div class="tel">
      <div class="card sumiu">
        <h3>🏛️ Multiclubes — quem você comanda?</h3>
        <div class="chips"><div class="chip on"><b>&nbsp;</b><small>&nbsp;</small></div><div class="chip"><b>&nbsp;</b><small>&nbsp;</small></div></div>
        <div class="btn tr">&nbsp;</div>
      </div>
      <div class="box"><h4>🏟️ Estádio</h4><p>Obras, lotação e patrocínio do seu clube.</p></div>
      <div class="box"><h4>🏛️ Quer um 2º clube?</h4><p>O painel de <b>comprar</b> volta a aparecer, igual antes de você ter comprado. Dá pra comprar outro quando quiser.</p></div>
    </div>
  </div>
</div>

<div style="height:20px"></div>
<div class="cols">
  <div class="col" style="flex:1.25">
    <p class="rot">O aviso antes de confirmar <i>trava</i></p>
    <div class="modal">
      <h2>💸 Vender o Adão Esporte?</h2>
      <div class="ok">✅ Você recebe <b>4.000 🪙</b> de volta, o mesmo que pagou. Não perde moeda nenhuma na troca.</div>
      <p style="font-family:system-ui;font-size:13.5px;margin:0 0 4px"><b>O que acontece com o Adão Esporte:</b></p>
      <ul>
        <li>Ele <b>continua no jogo</b>, na divisão em que está, só que comandado pela máquina.</li>
        <li>Fica com o <b>estádio, os títulos e o caixa dele</b> — nada disso vem pra você.</li>
        <li>Você <b>deixa de receber</b> a cota de TV e os prêmios dele.</li>
        <li>Os <b>empréstimos da SAF</b> que ele tem voltam pra SAF antes da venda.</li>
        <li>Some o botão de <b>trocar de comando</b> e a coluna dele na janela de contratos.</li>
      </ul>
      <div class="row"><div class="btn cz">Voltar</div><div class="btn vd">💸 Vender · 4.000 🪙</div></div>
    </div>
  </div>
  <div class="col">
    <p class="rot">Quando NÃO dá pra vender <i>segurança</i></p>
    <div class="box"><h4>🔒 Enquanto a rodada está rolando</h4><p>Mesma trava que já existe pra trocar de comando: espera a rodada acabar. Evita vender no meio de uma partida do clube.</p></div>
    <div class="box"><h4>🔒 Durante a Copa do Mundo</h4><p>Igual à troca de comando: a Copa termina primeiro.</p></div>
    <div class="box"><h4>🔒 O clube no comando</h4><p>Só dá pra vender o que está <b>dormindo</b>. Se quiser vender o outro, passa o comando primeiro. Assim nunca se vende a cadeira em que você está sentado.</p></div>
  </div>
</div>

<div class="nota">
  <b>Duas coisas que eu preciso que você decida:</b><br>
  1️⃣ <b>O caixa do 2º clube</b> (as moedas que ELE juntou jogando): a minha proposta é que fiquem com ele e sumam junto. Se voltassem pro seu bolso, daria pra comprar clube, esperar ele juntar dinheiro, vender e repetir — vira máquina de moeda.<br>
  2️⃣ <b>As cartas de empresário guardadas no clube que dormia</b>: some junto com ele, ou volta pro seu acervo? Elas foram ganhas por ele, mas quem abriu o pacote foi você.
</div>`

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 1200 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
