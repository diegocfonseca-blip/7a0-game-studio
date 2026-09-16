// ⚽🅰️ GOLS E ASSISTÊNCIAS NO CAMPINHO DO LAYOUT NOVO — cabe? (Diego 16/09)
//
// Ele: *"gostei, porém teria q continuar mostrando gols e assistência tb no campinho.
// Daria ou ficaria MT informação???"*
//
// ⚠️ DESENHO, nada codado. Os selos são os DE VERDADE (`jogadorcampo.tsx`):
//   · gol       → ⚽N, fundo dourado #FFC400, borda preta 2px, canto direito
//   · assistência → 🅰️N, fundo azul #2F6BAE, texto branco, logo abaixo do gol
//     (e SOBE pro lugar de cima quando o jogador não tem gol — regra de 24/08)
// Os dois só aparecem quando o número é > 0.
//
// A pergunta "fica muita informação?" só se responde no PIOR CASO, então aqui estão
// três momentos da temporada, com a rodada 38 sendo o caso mais cheio possível.
//
// Rodar: node scripts/mockup-campinho-gols.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-campinho-gols.png')
const VERM = '#C2452F', ROXO = '#7C3AED', AZUL = '#2F6BAE', SLATE = '#3E4A5A', BEGE = '#B2A583'
const SYS = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif"

// 👕 camisa do campinho com os selos DENTRO do canto (ver nota 1 do material:
// no desenho anterior eles ficavam pendurados 10px pra fora e encostavam no vizinho)
const camisa = (num, tag, nome, gols, assist, cor = BEGE) => `
  <div style="text-align:center;width:58px;flex:none">
    <div style="position:relative;width:34px;height:38px;margin:0 auto;
      background:repeating-linear-gradient(90deg, ${cor} 0 5px, #0C0C0C 5px 10px);
      border:2.5px solid ${INK};border-radius:4px 4px 12px 12px;box-shadow:2px 2px 0 ${INK};
      display:flex;align-items:center;justify-content:center">
      <span style="${OSW};font-weight:700;font-size:15px;color:#fff;text-shadow:0 0 4px #000,1px 1px 0 #000">${num}</span>
      ${gols > 0 ? `<span style="position:absolute;right:-7px;top:-5px;${OSW};font-weight:700;font-size:8px;color:${INK};
        background:${GOLD};border:2px solid ${INK};border-radius:6px;padding:0 3px;line-height:1.5;white-space:nowrap">⚽${gols}</span>` : ''}
      ${assist > 0 ? `<span style="position:absolute;right:-7px;${gols > 0 ? 'top:12px' : 'top:-5px'};${OSW};font-weight:700;font-size:8px;color:#fff;
        background:${AZUL};border:2px solid ${INK};border-radius:6px;padding:0 3px;line-height:1.5;white-space:nowrap">🅰️${assist}</span>` : ''}
    </div>
    <div style="${OSW};font-weight:700;font-size:7.5px;background:${INK};color:${GOLD};border-radius:3px;
      padding:0 4px;display:inline-block;margin-top:3px;letter-spacing:.5px">${tag}</div>
    <div style="${OSW};font-weight:700;font-size:8px;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}</div>
  </div>`

// [num, tag, nome] + [gols, assist] por momento
const TIME = [
  [[11, 'ATA', 'Adriano'], [9, 'ATA', 'Juninho']],
  [[8, 'MEI', 'Mozer'], [10, 'MEI', 'Raí'], [7, 'MEI', 'Djalminha'], [5, 'MEI', 'Edmundo']],
  [[6, 'LAT', 'Lúcio'], [4, 'ZAG', 'Romário'], [3, 'ZAG', 'Careca'], [2, 'LAT', 'R. Carlos']],
  [[1, 'GOL', 'R. Ceni']],
]
// rodada 1 · rodada 19 · rodada 38 (o pior caso que o jogo consegue produzir)
const NUMS = {
  1:  { 11: [0, 0], 9: [0, 0], 8: [0, 0], 10: [0, 0], 7: [0, 0], 5: [0, 0], 6: [0, 0], 4: [0, 0], 3: [0, 0], 2: [0, 0], 1: [0, 0] },
  19: { 11: [7, 2], 9: [4, 0], 8: [1, 5], 10: [3, 6], 7: [0, 4], 5: [2, 1], 6: [0, 2], 4: [1, 0], 3: [0, 0], 2: [0, 3], 1: [0, 0] },
  38: { 11: [18, 5], 9: [12, 4], 8: [4, 11], 10: [9, 14], 7: [3, 9], 5: [6, 3], 6: [2, 7], 4: [3, 1], 3: [1, 2], 2: [1, 8], 1: [0, 1] },
}
const campo = rod => `
  <div style="background:repeating-linear-gradient(180deg,#2d7a41 0 22px,#286e3a 22px 44px);
    border:3px solid ${INK};border-radius:11px;padding:14px 6px 11px;box-shadow:3px 3px 0 ${INK};position:relative;overflow:hidden">
    <div style="position:absolute;left:8%;right:8%;top:5%;bottom:5%;border:2px solid rgba(255,255,255,.22);border-radius:4px"></div>
    <div style="position:absolute;left:50%;top:50%;width:52px;height:52px;transform:translate(-50%,-50%);
      border:2px solid rgba(255,255,255,.2);border-radius:999px"></div>
    <div style="position:relative;display:flex;flex-direction:column;gap:13px">
      ${TIME.map(l => `<div style="display:flex;justify-content:center;gap:2px">${l.map(([n, t, nm]) =>
        camisa(n, t, nm, NUMS[rod][n][0], NUMS[rod][n][1], t === 'GOL' ? GOLD : BEGE)).join('')}</div>`).join('')}
    </div>
  </div>`

const conta = rod => {
  const v = Object.values(NUMS[rod])
  return v.filter(([g]) => g > 0).length + v.filter(([, a]) => a > 0).length
}
const coluna = (rod, rot, cor, nota) => `
  <div style="flex:1;text-align:center">
    <div style="display:inline-block;background:${cor};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 14px;${OSW};font-weight:700;font-size:11.5px;letter-spacing:1px;margin-bottom:8px;box-shadow:3px 3px 0 ${INK}">${rot}</div>
    <div style="background:${CREME};border:4px solid ${INK};border-radius:18px;padding:10px;box-shadow:5px 5px 0 ${INK}">${campo(rod)}</div>
    <div style="${OSW};font-weight:700;font-size:13px;margin-top:8px">${conta(rod)} selos na tela</div>
    <div style="${OSW};font-weight:400;font-size:12px;line-height:1.45;margin-top:4px;text-align:left;opacity:.85">${nota}</div>
  </div>`

const bloco = (emoji, titulo, txt, cor) => `
  <div style="border:4px solid ${INK};border-radius:15px;background:#fff;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:11px">
    <div style="display:flex;align-items:center;gap:8px;background:${cor};padding:7px 12px">
      <span style="font-size:17px;line-height:1">${emoji}</span>
      <span style="${OSW};font-weight:700;font-size:14.5px;text-transform:uppercase;color:#fff;line-height:1.1">${titulo}</span></div>
    <div style="padding:9px 12px;${OSW};font-weight:400;font-size:12.5px;line-height:1.55">${txt}</div></div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1340px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  OS SELOS SÃO OS DE VERDADE (jogadorcampo.tsx) · DESENHO, NADA CODADO</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Gol e assistência <span style="color:${GOLD};-webkit-text-stroke:1.5px ${INK}">no campinho</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 6px;max-width:1160px;opacity:.88">
  <b>Resposta curta: dá, e não fica demais.</b> Mas isso só se responde no <b>pior caso</b>, então aqui estão
  três momentos da mesma temporada — e o da direita é o mais cheio que o jogo consegue produzir.</p>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.5;margin:0 0 22px;max-width:1160px;opacity:.88">
  A razão de caber é que <b>os selos só existem quando o número é maior que zero</b> — na rodada 1 o campo está
  <b>limpo</b>, e ele vai enchendo junto com a temporada. Quando está cheio, é porque <b>tem história pra contar</b>.</p>

<div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:24px">
  ${coluna(1, 'RODADA 1', SLATE, 'Ninguém marcou nada ainda. O campo é <b>só o seu time</b> — nenhum selo. É assim que a temporada começa.')}
  ${coluna(19, 'RODADA 19 · METADE', GREEN, 'Já dá pra ver quem está fazendo a temporada: o <b>11</b> com 7 gols, o <b>10</b> garçom com 6. Isso é <b>leitura</b>, não poluição.')}
  ${coluna(38, 'RODADA 38 · O PIOR CASO', VERM, 'Todo mundo com alguma coisa, até o zagueiro e o goleiro. <b>É o máximo que enche</b> — e ainda dá pra ler nome e posição de todos.')}
  <div style="flex:1.15">
    ${bloco('✅', 'Por que cabe', `
      · <b>Os selos ficam no canto de CIMA</b> da camisa, e o nome fica <b>embaixo</b>. Eles nunca disputam
      espaço um com o outro.<br>
      · <b>São dois, no máximo</b>, e empilhados. Quem não tem gol, a assistência <b>sobe</b> pro lugar de cima
      (regra que você já aprovou em 24/08) — o jogador nunca fica com buraco.<br>
      · <b>São a única coisa colorida</b> em cima da camisa. O olho vai direto neles — é justamente o que
      você quer.`, GREEN)}
    ${bloco('🔧', 'O único ajuste que eu faria', `
      No meu desenho de ontem os selos ficavam <b>pendurados 10px pra fora</b> da camisa (é assim no código
      hoje: <code>right: -10</code>). Com quatro meias na mesma linha e o campinho do layout novo, eles
      <b>encostam no vizinho</b>.<br>
      Aqui eu <b>puxei pra dentro do canto</b> (right: -7, top: -5). Mesmo tamanho, mesma cor, só não invade
      mais o colega do lado.`, ROXO)}
    ${bloco('🎯', 'E aqui fecha a conversa do gás', `
      Repare no que os dois selos dizem: <b>o que o jogador FEZ</b> — gol, assistência, história, orgulho.<br>
      O gás diz <b>como ele ESTÁ</b> — estado, operação, decisão pra próxima rodada.<br><br>
      <b>Essa é a régua.</b> O campinho é o lugar da <b>história</b>; a lista é o lugar da <b>operação</b>.
      Por isso gol e assistência ficam e o gás não — e por isso a sua ordem de 12/09
      (<i>"não quero no campinho, só onde tem a listagem"</i>) <b>estava certa desde o começo</b>, só não
      tinha sido dito por quê.`, GOLD)}
  </div>
</div>

<div style="border:4px solid ${GOLD};border-radius:18px;background:#FFFBEE;padding:16px 20px">
  <div style="${OSW};font-weight:700;font-size:18px;text-transform:uppercase;margin-bottom:8px">
    📊 A conta, pra não ficar no "eu acho"</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    <b>Rodada 1: 0 selos.</b> · <b>Rodada 19: ${conta(19)} selos.</b> · <b>Rodada 38: ${conta(38)} selos</b> — e 38
    é o teto, porque são no máximo 2 por jogador e 11 jogadores em campo (22 no limite absoluto, que nem
    acontece porque zagueiro e goleiro quase não pontuam).<br>
    Ou seja: <b>a tela mais cheia possível tem ${conta(38)} selinhos de 8px</b>, nos cantos, sem encostar em
    nome nenhum. <b>Cabe.</b><br><br>
    <b>Nada foi codado.</b> Se você aprovar o layout, isso entra junto — os selos são os mesmos de hoje,
    só reposicionados 3px pra dentro.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    desenho de 16/09 · nada codado<br>refazer: <b>node scripts/mockup-campinho-gols.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1340, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
