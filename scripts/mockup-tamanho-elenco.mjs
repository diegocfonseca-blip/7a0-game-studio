// 📏 MOCKUP — dá pra aumentar o elenco sem atrapalhar a aba Elenco? (Diego, 15/09)
//
// Pergunta dele: *"o tamanho do elenco, se cabe eu colocar mais gente… pelo menos mais
// um de cada posição: um goleiro, um zagueiro, um meio, um atacante. Porém a gente tem
// que pensar que tem a SAF… se eu pegar quatro jogadores emprestados da SAF, eu tenho
// que emprestar quatro também? Tô falando isso pra saber visualmente se vai dar pra
// encaixar"*.
//
// ⚠️ AS ALTURAS AQUI NÃO SÃO CHUTE: saem da bancada `scripts/teste-elenco/`, que monta o
// `SquadTab` DE VERDADE (o mesmo componente do jogo) com 22, 27 e 31 jogadores, num
// celular de 454px. Pra refazer a medida:
//   DEPLOY_BASE=/ npx vite --port 5199
//   → /scripts/teste-elenco/index.html?n=22 (e ?n=27, ?n=31)
//
// Rodar: node scripts/mockup-tamanho-elenco.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-tamanho-elenco.png')
const VERM = '#C2452F', ROXO = '#7C3AED'
const shot = n => `data:image/png;base64,${readFileSync(`/tmp/elenco-${n}.png`).toString('base64')}`

// medido na bancada, em celular de 454px de largura
const MEDIDO = [
  { n: 22, alt: 2184, rot: 'HOJE', sub: '2× a formação', cor: INK },
  { n: 27, alt: 2459, rot: '+1 POR POSIÇÃO', sub: 'o que você pensou', cor: ROXO },
  { n: 31, alt: 2679, rot: '+1 E MAIS A SAF', sub: 'o teto na Série A', cor: VERM },
]

const coluna = (m) => `
  <div style="flex:1;text-align:center">
    <div style="display:inline-block;background:${m.cor};color:#fff;border:3px solid ${INK};border-radius:999px;
      padding:4px 14px;${OSW};font-weight:700;font-size:12px;letter-spacing:1px;box-shadow:3px 3px 0 ${INK}">${m.rot}</div>
    <div style="${OSW};font-weight:700;font-size:26px;margin-top:7px">${m.n} jogadores</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.65;margin-bottom:8px">${m.sub}</div>
    <img src="${shot(m.n)}" style="width:100%;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};display:block">
    <div style="${OSW};font-weight:700;font-size:13px;margin-top:8px">${m.alt}px de rolagem</div>
    <div style="${OSW};font-weight:400;font-size:11px;opacity:.7">${(m.alt / 900).toFixed(1)} telas de celular</div>
    ${m.n === 22 ? '' : `<div style="${OSW};font-weight:700;font-size:12px;color:${m.cor};margin-top:3px">+${m.alt - 2184}px que hoje</div>`}
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:32px 36px 28px;width:1180px}
</style>

<div style="${OSW};font-weight:700;font-size:12px;letter-spacing:2.4px;opacity:.6">MEDIDO NO JOGO · ABA ELENCO · CELULAR DE 454px</div>
<h1 style="${OSW};font-weight:700;font-size:38px;line-height:1.04;text-transform:uppercase;margin:4px 0 6px">
  Cabe <span style="color:${ROXO}">mais gente</span> no elenco?</h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.45;margin:0 0 22px;max-width:1000px;opacity:.84">
  Montei a aba Elenco de verdade com 22, 27 e 31 jogadores e medi a rolagem. <b>A resposta curta é: cabe.</b>
  O motivo é que a lista é em <b>DUAS COLUNAS</b> — titulares de um lado, reservas do outro —, então cada jogador
  novo só empurra <b>meia linha</b> de altura.</p>

<div style="display:flex;gap:22px;align-items:flex-start;margin-bottom:26px">${MEDIDO.map(coluna).join('')}</div>

<div style="display:flex;gap:22px;align-items:stretch">
  <div style="flex:1;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
    <div style="background:${GREEN};color:#fff;${OSW};font-weight:700;font-size:15px;letter-spacing:1px;
      padding:10px 14px;text-transform:uppercase">✅ o que a medida diz</div>
    <div style="padding:12px 14px;${OSW};font-weight:400;font-size:13.5px;line-height:1.55">
      <div style="margin-bottom:8px">· <b>+5 jogadores custam +275px</b> — menos de <b>1/3 de tela</b> a mais.
        De 2,4 pra 2,7 telas de rolagem.</div>
      <div style="margin-bottom:8px">· Mesmo no teto (27 + os 4 da SAF = 31) são <b>3 telas</b>. A aba Elenco já
        é a mais comprida do jogo hoje, e continuaria sendo — só que um pouco mais.</div>
      <div style="margin-bottom:8px">· <b>Metade da altura nem é a lista:</b> é o banner, o campinho, o
        🏛️ Departamento Técnico e a folha salarial. A lista só começa lá embaixo.</div>
      <div>· E o elenco não é um "22" chutado: é <b>2× a sua formação</b> por posição
        (4-4-2 → GOL 2 · LAT 4 · ZAG 4 · MEI 8 · ATA 4).</div>
    </div>
  </div>

  <div style="flex:1;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
    <div style="background:${INK};color:${GOLD};${OSW};font-weight:700;font-size:15px;letter-spacing:1px;
      padding:10px 14px;text-transform:uppercase">🏢 e a SAF, como funciona</div>
    <div style="padding:12px 14px;${OSW};font-weight:400;font-size:13.5px;line-height:1.55">
      <div style="margin-bottom:8px">· <b>NÃO é troca.</b> As vagas são <b>por lado</b>: você pode pegar 4 sem
        emprestar nenhum. Pegar e emprestar são contas separadas.</div>
      <div style="margin-bottom:8px">· Quantas vagas <b>por lado</b>, pela sua divisão:
        <b>Série D 1 · C 2 · B 3 · A 4</b>.</div>
      <div style="margin-bottom:8px">· <b>O que limita na prática:</b> a SAF precisa manter o time titular DELA
        completo. Se ela não tem sobra na posição, não dá pra puxar — e aí emprestar um seu primeiro
        <b>abre a vaga lá</b>. É daí que vem a impressão de que é troca.</div>
      <div>· ⚠️ E quem você pega <b>entra no seu elenco por cima do limite</b>: hoje o teto real na Série A já é
        <b>22 + 4 = 26</b>, não 22.</div>
    </div>
  </div>
</div>

<div style="margin-top:22px;border:4px solid ${ROXO};border-radius:18px;background:#F6F0FF;padding:14px 16px">
  <div style="${OSW};font-weight:700;font-size:16px;text-transform:uppercase;color:${ROXO};margin-bottom:6px">
    👉 o que eu faria</div>
  <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.6">
    <b>Visualmente, +1 por posição passa tranquilo</b> — o aperto não é a tela. O que eu olharia antes é o
    <b>jogo</b>: hoje o elenco é exatamente <b>2× a formação</b>, uma régua limpa que o leilão, o Monte, a base e a
    SAF todos usam. Subir pra "2× + 1" mexe em quantas cartas o leilão precisa pôr na mesa e em quanto sai de
    folha salarial todo mês. <b>Nada disso é impeditivo</b> — só não é uma linha só de código, e vale medir
    o efeito no bolso antes de soltar. Se quiser, eu meço isso também e te mostro.</div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 600 }, deviceScaleFactor: 1.6 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
