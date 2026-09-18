// 🌱🤖 MOCKUP — "O AUTOMÁTICO ESTÁ LIGADO, MAS NÃO TEM POR QUEM TROCAR"
//
// Pedido do Diego (18/09), com os prints do elenco na mão:
// *"vamos supor que eu tenho três meio-campos. Os três meio-campos cansaram, o
// modo automático ligado, e não tem reserva. Aí tem que aparecer uma pergunta
// falando: ó, você não tem reservas, o automático está ligado mas você não tem
// reservas — você quer que suba um jogador da base? Aí ele responde sim, e cai na
// área da base e sobe os jogadores. Porque às vezes a pessoa está com o modo
// automático e não sabe que não comprou o jogador, que está sem reserva"*.
//
// 🔍 O QUE O JOGO FAZ HOJE (conferido em `pyramidseason.tsx`): a conta que ele
// descreve JÁ EXISTE — `semReserva = nRuins > 0 && (!sug || sug.trocas.length <
// nRuins)`. O que falta é o que ela mostra: uma linha amarela pequena, de 10px,
// que só fala em leilão ("monte banco no leilão") e NÃO cita a Base. Com o
// automático ligado ela fica ainda mais escondida, porque o botão verde de
// RODIZIAR some (o automático já fez o que dava) e sobra só essa frase solta.
// 👉 O caminho da Base já existe e já funciona (`ID_BASE`, o mesmo botão 🌱 SUBIR
// DA BASE que mora na aba RESERVAS). Só nunca foi oferecido NESTE momento.
//
// ⚠️ SÓ DESENHO. Nada mexido no jogo. Rodar: node scripts/mockup-aviso-base.mjs
import { chromium } from 'playwright-core'

const SAIDA = process.argv[2] || '/tmp/aviso-base.png'
const INK = '#0C0C0C', GOLD = '#FFC400', CREME = '#F4ECD6', VERDE = '#1B7A3D', VERM = '#C2452F'

const caixa = (dentro) => `<div style="border:3px solid ${INK};background:#FFF6D6;border-radius:11px;padding:9px 12px;box-shadow:3px 3px 0 ${INK}">${dentro}</div>`

const cabecalho = `
  <p style="font-weight:900;font-size:11px;letter-spacing:.6px;color:#5a5647;margin:0;text-transform:uppercase;display:flex;align-items:center">
    <span style="flex:1">😓 Quem está cansado</span>
    <span style="width:20px;height:20px;border-radius:999px;border:2px solid ${INK};background:#fff;font-size:11px;text-align:center;line-height:16px">?</span>
  </p>
  <p style="font-size:12px;font-weight:700;line-height:1.6;margin:4px 0 0">
    🚑 <b style="color:#7A1B1B">Fellype Gabriel, Toró, Márcio Araújo</b></p>`

const botaoAuto = `
  <div style="display:flex;gap:6px;margin-top:8px">
    <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;padding:7px 8px;background:${VERDE};color:#fff;box-shadow:2px 2px 0 ${INK};text-align:center">
      <span style="font-weight:900;font-size:11px">✔ AUTOMÁTICO</span>
      <span style="display:block;font-weight:700;font-size:9px;opacity:.85;margin-top:1px">ligado · toque pra desligar</span></div>
  </div>`

const HOJE = caixa(cabecalho + botaoAuto + `
  <p style="font-size:10px;font-weight:800;color:#8a6d00;margin:6px 0 0;line-height:1.4">⚠️ Sem reserva inteiro pra toda vaga — monte banco no leilão.</p>`)

const NOVO = caixa(cabecalho + botaoAuto + `
  <div style="border:2.5px solid ${VERM};background:#FDECEA;border-radius:10px;padding:9px 10px;margin-top:8px">
    <p style="font-weight:900;font-size:12px;margin:0 0 3px;color:#8a2318;line-height:1.3">🤖 O automático está ligado — mas não tem por quem trocar.</p>
    <p style="font-size:10.5px;font-weight:700;color:#7a2418;margin:0 0 8px;line-height:1.45">
      Você não tem <b>reserva inteiro de MEI</b>. Os três cansados vão entrar em campo cansados.<br>
      <b>Quer subir um guri da Base pro banco?</b> É de graça — mas ele é <b>fraco de propósito</b>. O time de verdade se monta no leilão.</p>
    <div style="display:flex;gap:6px">
      <div style="flex:1.3;border:2.5px solid ${INK};border-radius:9px;padding:7px 9px;background:${VERDE};color:#fff;box-shadow:2px 2px 0 ${INK};text-align:center">
        <span style="font-weight:900;font-size:11.5px">🌱 SIM, VER A BASE</span>
        <span style="display:block;font-weight:700;font-size:8.5px;opacity:.9;margin-top:1px">leva pro sub-20, logo abaixo</span></div>
      <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;padding:7px 9px;background:#fff;color:${INK};box-shadow:2px 2px 0 ${INK};text-align:center">
        <span style="font-weight:900;font-size:11.5px">AGORA NÃO</span>
        <span style="display:block;font-weight:700;font-size:8.5px;opacity:.6;margin-top:1px">jogam cansados mesmo</span></div>
    </div>
  </div>`)

const col = (rot, cor, dentro, nota) => `
  <div style="flex:1">
    <div style="display:inline-block;background:${cor};color:#fff;font-weight:900;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:8px;margin-bottom:9px">${rot}</div>
    <div style="background:${CREME};border:3px solid ${INK};border-radius:18px;padding:11px">${dentro}</div>
    <p style="font-size:12.5px;font-weight:700;margin:9px 2px 0;line-height:1.45;color:#5f5848">${nota}</p>
  </div>`

const html = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0}
  body{font-family:Oswald,system-ui;color:${INK};background:${CREME};width:1060px;padding:30px}
  h1{font-size:44px;font-weight:900;text-transform:uppercase;line-height:.95}
  h1 .g{color:${VERDE}}
  .lead{background:${GOLD};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:14px 18px;font-size:16px;font-weight:700;margin:13px 0 22px;line-height:1.45}
  .par{display:flex;gap:26px;align-items:flex-start}
  .cx{border:3px solid ${INK};background:#fff;border-radius:14px;box-shadow:4px 4px 0 ${INK};padding:15px 19px;margin-top:22px;font-size:15px;font-weight:700;line-height:1.6}
  .cx b{color:${VERDE}}
  .seg{border:3px solid ${VERDE};background:#EAF5EE;border-radius:14px;padding:14px 18px;margin-top:14px;font-size:15px;font-weight:700;line-height:1.55}
  .seg b{color:${VERDE}}
</style>

<h1>"O AUTOMÁTICO TÁ LIGADO,<br><span class="g">MAS NÃO TEM RESERVA"</span></h1>
<div class="lead">Você tem razão, e a conta que você descreveu <b>já existe no jogo</b> — o que falta é ela FALAR.
Hoje, quando o automático não acha por quem trocar, sai só uma frase de 10px dizendo "monte banco no leilão".
Com o automático ligado ela fica ainda mais escondida, porque o botão verde de RODIZIAR some (o automático já
fez o que dava) e sobra aquela linha solta. <b>E ela nem cita a Base.</b></div>

<div class="par">
  ${col('hoje', '#b9b1a0', HOJE, 'A pessoa lê "monte banco no leilão", que é coisa pro fim da temporada — e entra em campo com os três cansados sem saber que dava pra tapar a vaga AGORA.')}
  ${col('proposta', VERDE, NOVO, 'A pergunta aparece no momento exato: diz que o automático está sem saída, diz a POSIÇÃO que falta, e oferece o caminho. "Sim" leva direto pra área da Base, que já existe.')}
</div>

<div class="cx">
  <b>Por que assim, e não de outro jeito</b><br>
  🎯 <b>Só aparece quando é verdade</b>: titular ruim + o automático sem troca possível. Time inteiro, ou com reserva
  sobrando, não vê nada — aviso que aparece à toa vira aviso que ninguém lê.<br>
  🚫 <b>Nada sobe sozinho.</b> O guri da Base só entra se VOCÊ mandar — o jogo nunca escala ninguém por você, e
  "AGORA NÃO" é uma saída de verdade (dá pra jogar cansado mesmo, que é escolha sua).<br>
  🌱 <b>A Base continua sendo o remédio ruim</b>, e o texto diz isso na cara: de graça, mas fraco de propósito.
  O time de verdade se monta no leilão — igual você já tinha pedido em 13/09.<br>
  ↩️ <b>Nenhuma regra nova</b>: a Base, o botão 🌱 SUBIR DA BASE e a conta de "sem reserva" já existem hoje.
  Isto é só a pergunta ligando uma coisa na outra.
</div>

<div class="seg">
  ❓ <b>Uma dúvida sua que eu quero acertar antes de codar:</b> a pergunta deve aparecer <b>só com o automático
  ligado</b> (foi como você descreveu), ou <b>sempre que faltar reserva</b> — automático ligado ou não? Quem joga
  na mão tem o mesmo problema e hoje recebe o mesmo aviso fraquinho.<br>
  Eu faria <b>sempre que faltar reserva</b>, mudando só a primeira linha: com o automático ligado ela explica que
  ele está sem saída; sem automático, que ninguém vai trocar sozinho. Mas você decide.
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1060, height: 900 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(SAIDA)
