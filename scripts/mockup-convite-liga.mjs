#!/usr/bin/env node
// ─── 📤 MOCKUP: ONDE FICA O CONVITE DA LIGA (31/08) ──────────────────────────
//
// Pedido do Diego: *"um amigo disse q criou o Minhas Ligas mas n soube aonde
// manda o convite pros amigos dele após ele criar"*.
//
// ── O QUE EU MEDI NO CÓDIGO (não é achismo) ─────────────────────────────────
// O botão EXISTE — a caixa roxa "📣 Chame a galera" (lobby.tsx:3226). O
// problema são três, e os três batem no mesmo minuto:
//
//  1. 🏠 NO CARD DA HOME NÃO TEM CONVITE NENHUM. Em "🏆 Minhas ligas" o dono só
//     tem ▶️ Entrar · ✏️ Editar · 🗑️ Excluir. É o primeiro lugar que ele olha
//     depois de criar — e ali não tem como chamar ninguém.
//  2. 📜 DENTRO DA SALA O CONVITE FICA LÁ EMBAIXO. Entre o código e a caixa roxa
//     tem o bloco inteiro da liga: dia marcado, remarcar, regra do ranking. No
//     celular isso é mais de uma tela de rolagem — quem não rola, não acha.
//  3. 🔒 O CONVITE NÃO FALA DA SENHA. A liga EXIGE senha (obrigatória desde
//     29/08), mas o texto compartilhado manda só nome + código + link. O amigo
//     clica, chega na porta e trava. O dono jura que mandou o convite.
//
// ── O QUE MUDA (é isto que o Diego decide) ──────────────────────────────────
//  A. 📤 Convidar no card da home, do lado de Editar/Excluir (só pro dono).
//  B. Na sala da liga, a caixa roxa sobe pra logo DEBAIXO DO CÓDIGO.
//  C. O texto do convite passa a levar a SENHA junto — com um campinho pro dono
//     escrever qual é. Nada fica guardado: o banco só tem a senha embaralhada e
//     continua assim. Quem esqueceu troca em ✏️ Editar, que já existe.
//
//   node scripts/mockup-convite-liga.mjs --saida /tmp/convite-liga.png

import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'mockup-convite-liga.png')
const b64 = f => fs.readFileSync(f).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

const CREME = '#F4ECD6', TINTA = '#0C0C0C', OURO = '#FFC400', VERDE = '#1B7A3D', ROXO = '#7C3AED', VERM = '#C2452F'
const ROXO_ESC = '#5B21B6'

const chamaGalera = (comSenha) => `
  <div class="zap">
    <p class="zap-t">📣 Chame a galera</p>
    <p class="zap-s">Manda o link — quem já tem conta cai direto na sala; quem não tem, cadastra e vem parar aqui.</p>
    ${comSenha ? `
    <div class="zap-pw">
      <p>🔒 senha da liga (vai junto no convite)</p>
      <div class="zap-pw-in"><b>peladinha</b></div>
    </div>` : ''}
    <div class="zap-bt"><span class="zap-b1">📤 Compartilhar convite</span><span class="zap-b2">📋</span></div>
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Oswald;src:url('${fonte(400)}') format('woff2');font-weight:400}
@font-face{font-family:Oswald;src:url('${fonte(600)}') format('woff2');font-weight:600}
@font-face{font-family:Oswald;src:url('${fonte(700)}') format('woff2');font-weight:700}
*{box-sizing:border-box;margin:0;padding:0}
body{background:${CREME};font-family:Inter,system-ui,sans-serif;color:${TINTA};width:1240px;padding:28px 26px 34px}
h1{font-family:Oswald;font-weight:700;font-size:36px;text-transform:uppercase;line-height:1}
.pil{display:inline-block;font-family:Oswald;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;
  background:${OURO};border:2.5px solid ${TINTA};border-radius:99px;padding:3px 12px;box-shadow:3px 3px 0 ${TINTA};margin-bottom:9px}
.lead{font-size:13px;font-weight:700;color:rgba(12,12,12,.62);margin-top:6px;line-height:1.45;max-width:900px}
.par{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
.tela{border:4px solid ${TINTA};border-radius:18px;background:#fff;box-shadow:6px 6px 0 ${TINTA};overflow:hidden}
.cab{background:${TINTA};color:#fff;padding:9px 15px;display:flex;justify-content:space-between;align-items:center}
.cab b{font-family:Oswald;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.6px}
.cab span{font-size:11px;font-weight:700;color:rgba(255,255,255,.6)}
.cab.ruim{background:${VERM}}
.cab.bom{background:${VERDE}}
.corpo{padding:14px 15px 16px;background:${CREME};min-height:452px}
/* card minhas ligas */
.mlbox{border:3px solid ${TINTA};border-radius:16px;background:#FFF4CF;padding:11px;box-shadow:4px 4px 0 ${TINTA}}
.mltit{font-family:Oswald;font-weight:700;font-size:14px;color:#7a4d00;margin-bottom:7px}
.ml{border:2.5px solid ${TINTA};border-radius:12px;background:#fff;padding:9px 11px}
.ml-top{display:flex;align-items:center;gap:9px}
.ml-nome{font-family:Oswald;font-weight:700;font-size:15px}
.ml-sub{font-size:11px;font-weight:700;color:rgba(12,12,12,.55);margin-top:1px}
.ml-dia{font-family:Oswald;font-weight:700;font-size:12px;color:${VERDE};margin-top:1px}
.ml-ent{font-family:Oswald;font-weight:700;font-size:11.5px;text-transform:uppercase;background:${VERDE};color:#fff;
  border:2px solid ${TINTA};border-radius:9px;padding:7px 11px;flex:none}
.ml-bts{display:flex;gap:7px;margin-top:8px}
.bt{flex:1;text-align:center;font-family:Oswald;font-weight:700;font-size:11.5px;border:2px solid ${TINTA};border-radius:9px;padding:6px 4px;background:#fff}
.bt.verm{background:#E8503A;color:#fff}
.bt.roxo{background:${ROXO};color:#fff}
.bt.novo{box-shadow:0 0 0 3px ${OURO}}
/* sala de espera */
.sala{border:3px solid ${TINTA};border-radius:14px;background:${TINTA};padding:12px 12px 13px}
.sala-nome{font-family:Oswald;font-weight:700;font-size:16px;color:#fff;text-align:center}
.sala-lab{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,.45);text-align:center;margin-top:5px}
.sala-cod{font-family:Oswald;font-weight:700;font-size:34px;letter-spacing:8px;color:#fff;text-align:center;line-height:1.1}
.zap{border:3px solid ${TINTA};border-radius:14px;padding:10px 11px;margin-top:9px;
  background:linear-gradient(135deg,${ROXO} 0%,${ROXO_ESC} 100%);box-shadow:4px 4px 0 ${TINTA}}
.zap-t{font-family:Oswald;font-weight:700;font-size:13.5px;color:#fff}
.zap-s{font-size:10.5px;font-weight:600;color:rgba(255,255,255,.8);line-height:1.35;margin-top:2px}
.zap-pw{border:2px solid ${TINTA};border-radius:9px;background:rgba(255,255,255,.14);padding:6px 8px;margin-top:7px}
.zap-pw p{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.7)}
.zap-pw-in{border:2px solid ${TINTA};border-radius:7px;background:#fff;padding:4px 8px;margin-top:3px}
.zap-pw-in b{font-family:Oswald;font-weight:700;font-size:14px}
.zap-bt{display:flex;gap:7px;margin-top:8px}
.zap-b1{flex:1;text-align:center;font-family:Oswald;font-weight:700;font-size:11.5px;text-transform:uppercase;
  background:#fff;border:2px solid ${TINTA};border-radius:11px;padding:8px}
.zap-b2{font-size:13px;background:${OURO};border:2px solid ${TINTA};border-radius:11px;padding:8px 11px}
.bloco{border:3px solid ${TINTA};border-radius:13px;background:#fff;padding:9px 11px;margin-top:9px}
.bloco p{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:rgba(12,12,12,.45)}
.bloco b{font-family:Oswald;font-weight:700;font-size:15px;display:block;margin-top:1px}
.bloco i{font-style:normal;font-size:11px;font-weight:700;color:rgba(12,12,12,.5);display:block;margin-top:3px;line-height:1.35}
.rolagem{text-align:center;font-family:Oswald;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;
  color:rgba(12,12,12,.35);padding:7px 0 3px}
.corte{border-top:3px dashed rgba(12,12,12,.28);margin:8px 0 0}
/* zap fake */
.fone{border:4px solid ${TINTA};border-radius:16px;background:#ECE5DD;padding:11px;box-shadow:4px 4px 0 ${TINTA}}
.balao{background:#DCF8C6;border:2.5px solid ${TINTA};border-radius:12px;padding:9px 11px;font-size:12.5px;font-weight:700;line-height:1.5}
.balao .lk{color:#1B6FC2;text-decoration:underline;word-break:break-all}
.balao .sn{background:${OURO};border:1.5px solid ${TINTA};border-radius:5px;padding:0 5px}
.hora{text-align:right;font-size:10px;font-weight:700;color:rgba(12,12,12,.4);margin-top:3px}
.nota{font-size:11.5px;font-weight:700;color:rgba(12,12,12,.62);margin-top:9px;line-height:1.45}
.selo{display:inline-block;font-family:Oswald;font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;
  border:2px solid ${TINTA};border-radius:99px;padding:2px 9px;background:${OURO};margin-bottom:6px}
.tres{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:20px}
.card{border:3px solid ${TINTA};border-radius:14px;background:#fff;padding:11px 12px;box-shadow:4px 4px 0 ${TINTA}}
.card b{font-family:Oswald;font-weight:700;font-size:14px;display:block;margin-bottom:3px}
.card p{font-size:11.5px;font-weight:700;color:rgba(12,12,12,.62);line-height:1.45}
.rod{text-align:center;font-size:12px;font-weight:700;color:rgba(12,12,12,.45);margin-top:20px}
</style></head><body>

<span class="pil">📤 conserto de caminho · nada de arte nova</span>
<h1>Onde fica o convite da liga</h1>
<p class="lead">O amigo criou a liga e não achou como chamar a turma. O botão existe — só que está no lugar errado e
não conta a coisa mais importante: <b>a liga tem SENHA</b>, e o convite de hoje manda só o código. O amigo clica, chega na porta e trava.</p>

<div class="par">
  <div class="tela">
    <div class="cab ruim"><b>Hoje · a home depois de criar</b><span>🏆 Minhas ligas</span></div>
    <div class="corpo">
      <div class="mlbox">
        <p class="mltit">🏆 Minhas ligas</p>
        <div class="ml">
          <div class="ml-top">
            <div style="flex:1;min-width:0">
              <p class="ml-nome">Peladão da Firma</p>
              <p class="ml-sub">👥 1 · 4FTOS5 · com bots</p>
              <p class="ml-dia">📅 Sábado, 20:30</p>
            </div>
            <span class="ml-ent">▶️ Entrar</span>
          </div>
          <div class="ml-bts">
            <span class="bt">✏️ Editar</span>
            <span class="bt verm">🗑️ Excluir a liga</span>
          </div>
        </div>
      </div>
      <p class="nota">🕳️ <b>Aqui não tem como chamar ninguém.</b> É o primeiro lugar que o dono olha depois de criar —
      e as três opções são entrar, editar e apagar. O convite só existe lá dentro da sala.</p>
      <p class="nota">📜 E lá dentro ele está <b>depois do bloco inteiro da liga</b> (dia marcado, remarcar, regra do ranking):
      no celular é mais de uma tela de rolagem. Quem não rolou, não achou.</p>
      <p class="nota">🔒 E mesmo achando, o texto que vai pro zap <b>não fala da senha</b> — que é obrigatória na liga.
      O amigo recebe o link, cai na porta trancada e o dono jura que mandou o convite certo.</p>
    </div>
  </div>

  <div class="tela">
    <div class="cab bom"><b>Proposta · a home</b><span>o convite onde ele procura</span></div>
    <div class="corpo">
      <div class="mlbox">
        <p class="mltit">🏆 Minhas ligas</p>
        <div class="ml">
          <div class="ml-top">
            <div style="flex:1;min-width:0">
              <p class="ml-nome">Peladão da Firma</p>
              <p class="ml-sub">👥 1 · 4FTOS5 · com bots</p>
              <p class="ml-dia">📅 Sábado, 20:30</p>
            </div>
            <span class="ml-ent">▶️ Entrar</span>
          </div>
          <div class="ml-bts">
            <span class="bt roxo novo">📤 Convidar</span>
            <span class="bt">✏️ Editar</span>
            <span class="bt verm">🗑️ Excluir</span>
          </div>
        </div>
      </div>
      <p class="nota">✅ <b>📤 Convidar</b> entra do lado de Editar/Excluir, só pra quem é <b>dono</b> — convidado não vê
      (igual hoje, pra ninguém achar que pode mexer na liga dos outros).</p>
      <p class="nota">Aperta e abre o mesmo compartilhar de sempre (WhatsApp, Telegram, o que o celular tiver).
      Sem sala nova, sem tela nova: é o botão que já existe, na porta da frente.</p>
      <div class="bloco" style="background:#EAF6EE">
        <p>o que não muda</p>
        <b>Nada da liga</b>
        <i>Não mexe em código, senha, dia marcado, troféu nem em quem já está dentro. É só um caminho a mais pro mesmo convite.</i>
      </div>
    </div>
  </div>
</div>

<div class="par">
  <div class="tela">
    <div class="cab ruim"><b>Hoje · dentro da liga</b><span>o convite fica no fim</span></div>
    <div class="corpo">
      <div class="sala">
        <p class="sala-nome">Peladão da Firma</p>
        <p class="sala-lab">Código da Sala</p>
        <p class="sala-cod">4FTOS5</p>
      </div>
      <div class="bloco"><p>🏆 minhas ligas · próximo jogo</p><b>Sábado, 20:30</b><i>📅 Remarcar · ⚖️ como conta o ranking</i></div>
      <div class="bloco"><p>⚖️ regra do rank desta liga</p><b>Título +30 · Copa +20 · Z4 −10</b><i>o dono pode mudar em ⚙️ Ajustes</i></div>
      <div class="bloco"><p>👥 quem já está na sala</p><b>Você (dono)</b><i>aguardando… (1/2 mínimo)</i></div>
      <p class="rolagem">↓ ↓ ↓ mais uma tela de rolagem ↓ ↓ ↓</p>
      <div class="corte"></div>
      ${chamaGalera(false)}
      <p class="nota">📜 O convite é o <b>último</b> bloco. Quem acabou de criar a liga não sabe que precisa rolar até o fim.</p>
    </div>
  </div>

  <div class="tela">
    <div class="cab bom"><b>Proposta · dentro da liga</b><span>convite colado no código</span></div>
    <div class="corpo">
      <div class="sala">
        <p class="sala-nome">Peladão da Firma</p>
        <p class="sala-lab">Código da Sala</p>
        <p class="sala-cod">4FTOS5</p>
      </div>
      ${chamaGalera(true)}
      <div class="bloco"><p>🏆 minhas ligas · próximo jogo</p><b>Sábado, 20:30</b><i>📅 Remarcar · ⚖️ como conta o ranking</i></div>
      <div class="bloco"><p>👥 quem já está na sala</p><b>Você (dono)</b><i>aguardando… (1/2 mínimo)</i></div>
      <p class="nota">✅ Na <b>liga</b>, a caixa roxa sobe pra logo debaixo do código — chamar a galera é a primeira coisa
      a fazer numa sala que acabou de nascer. Na sala ⚡ Rápida <b>fica como está</b> (lá o código já basta).</p>
      <p class="nota">🔒 O campinho da senha é <b>só pra escrever o que vai no convite</b>. Nada é guardado: o banco continua
      só com a senha embaralhada. Esqueceu qual era? Troca em <b>✏️ Editar</b>, que já existe desde 29/08.</p>
    </div>
  </div>
</div>

<div class="tres">
  <div class="card" style="grid-column:1 / span 2">
    <span class="selo">3 · o que chega no zap</span>
    <div class="fone">
      <div class="balao">
        🏆 Te chamei pra minha liga no Leilão Legends!<br><br>
        <b>Peladão da Firma</b><br>
        📅 Sábado, 20:30<br>
        🔑 Código: <b>4FTOS5</b><br>
        🔒 Senha: <span class="sn">peladinha</span><br><br>
        Entra por aqui 👇<br>
        <span class="lk">leilaolegends.com/?j=4FTOS5</span>
        <p class="hora">20:31 ✓✓</p>
      </div>
    </div>
    <p class="nota">Hoje esta mensagem sai <b>sem o dia e sem a senha</b> — só nome, código e link. É por isso que o amigo
    trava na porta. Com o dia junto, ninguém pergunta "que horas mesmo?" no grupo.</p>
  </div>
  <div class="card">
    <span class="selo">dá pra voltar atrás?</span>
    <p><b>Dá, e é fácil.</b> Não encosta em nada do jogo: nem no leilão, nem em assento, nem no banco de dados.
    É um botão a mais na home, uma caixa que muda de lugar dentro da liga e um texto de mensagem mais completo.<br><br>
    Se você não gostar, um revert põe tudo no lugar e ninguém perde liga, troféu ou senha.</p>
  </div>
</div>

<p class="rod">Leilão Legends · mockup de 31/08 — nada disto está no ar. Só vai pro jogo com o seu OK.</p>
</body></html>`

const arquivo = '/tmp/mockup-convite-liga.html'
fs.writeFileSync(arquivo, html)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1240, height: 1400 }, deviceScaleFactor: 2 })
await page.goto(`file://${arquivo}`)
await page.waitForTimeout(600)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`✅ ${saida}`)
