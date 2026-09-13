// ─── 🏆🤝 MOCKUP: PATROCINADOR MASTER (contrato de vários anos) ──────────────
//
// Pedido do Diego (13/09): *"hoje o patrocínio é uma aposta — você aposta que
// vai continuar na divisão, que vai se classificar, subir, ou que vai ser
// campeão. Agora eu quero fazer um patrocinador MASTER, que é com base em
// CONTRATOS. Um que vai fazer um ano de contrato, outro dois, outro três,
// outro quatro, outro cinco, e sugestões de valores, e tudo vai variar com
// base na divisão que o cara está. Se ele fechou na Várzea um contrato de
// cinco temporadas e logo na segunda já vai pra Série D, não importa, vai
// continuar ganhando aquele valor. Só quando acabar o contrato é que chega
// outra proposta de master pra ele. Ele aparece PRIMEIRO do que o das
// apostas. E o das apostas passa a se chamar PATROCINADOR PONTUAL."*
//
//   node scripts/mockup-patrocinio-master.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'patrocinio-master.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const logo = f => { const m = readFileSync(f, 'utf8').match(/'(data:image\/[^']+)'/); return m ? m[1] : '' }
const L_MAX = logo('src/escalacao/maxjoias.ts')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CREME = '#F4ECD6'

// ─── 💰 A RÉGUA PROPOSTA ────────────────────────────────────────────────────
// 1 temporada = o mesmo que a aposta segura (🛡️ não cair) daquela divisão.
// Cada temporada A MAIS soma METADE desse valor.
// 5 temporadas = exatamente o que o 👑 campeão pagaria — só que GARANTIDO.
const BASE = { V: 2, D: 4, C: 8, B: 16, A: 32 }
const val = (div, anos) => BASE[div] * (1 + (anos - 1) / 2)
const DIVS = [['V', '🌱 Várzea'], ['D', 'Série D'], ['C', 'Série C'], ['B', 'Série B'], ['A', 'Série A']]

// as 5 marcas master — cada uma fecha um PRAZO diferente (foi como ele descreveu)
const MASTER = [
  { anos: 1, nome: 'Rádio Grito de Gol', emoji: '📻', cor: '#B5651D' },
  { anos: 2, nome: 'Pé-de-Ferro Transportes', emoji: '🚚', cor: '#5A4632' },
  { anos: 3, nome: 'Banco Gol de Placa', emoji: '🏦', cor: '#0E3E86' },
  { anos: 4, nome: 'AeroCraque', emoji: '✈️', cor: '#2E6C9E' },
  { anos: 5, nome: 'Trovão Energia', emoji: '⚡', cor: '#7C3AED' },
]

const fone = (inner, rot, cor, nota, w = 372) => `
<div style="flex:0 0 ${w}px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:44px">${nota}</div>
  <div style="width:${w}px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const cab = (sub = 'Série C') => `
  <div style="background:${INK};padding:11px 13px;color:#fff">
    <div style="${OSW};font-size:9.5px;letter-spacing:.08em;color:${GOLD}">TEMPORADA 12 · LIGA LEGENDS</div>
    <div style="${OSW};font-size:19px;margin-top:1px">Começando…</div>
    <div style="font-family:system-ui;font-size:10.5px;font-weight:700;opacity:.65">${sub}</div>
  </div>`

const quadro = (bg, inner, mb = 10) =>
  `<div style="border:3px solid ${INK};border-radius:15px;background:${bg};box-shadow:3px 3px 0 ${INK};margin:0 0 ${mb}px;overflow:hidden">${inner}</div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:5px 5px 0 ${INK};padding:14px 16px;margin-bottom:16px">
    <div style="${OSW};font-size:14px;margin-bottom:6px">${tit}</div>
    <div style="font-family:system-ui;font-size:12px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

// ── faixa do MASTER com contrato JÁ CORRENDO (o caso do dia a dia) ─────────
const masterCorrendo = (m, div, anoAtual) => quadro('#fff', `
  <div style="background:linear-gradient(150deg,${m.cor},#14142a);padding:9px 12px;color:#fff;display:flex;align-items:center;justify-content:space-between">
    <div>
      <div style="${OSW};font-size:9.5px;letter-spacing:.08em;color:${GOLD}">🏆 PATROCINADOR MASTER</div>
      <div style="${OSW};font-size:16px;line-height:1.15">${m.emoji} ${m.nome}</div>
    </div>
    <div style="text-align:right">
      <div style="${OSW};font-size:20px;color:${GOLD}">+${val(div, m.anos)} 🪙</div>
      <div style="font-family:system-ui;font-size:9px;font-weight:700;opacity:.8">por temporada</div>
    </div>
  </div>
  <div style="padding:9px 12px">
    <div style="display:flex;gap:4px;margin-bottom:6px">
      ${Array.from({ length: m.anos }, (_, i) => `<div style="flex:1;height:9px;border:2px solid ${INK};border-radius:4px;background:${i < anoAtual ? GREEN : '#fff'}"></div>`).join('')}
    </div>
    <div style="font-family:system-ui;font-size:10.5px;font-weight:700">Temporada <b>${anoAtual}</b> de <b>${m.anos}</b> do contrato · faltam <b>${m.anos - anoAtual}</b></div>
    <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.55);line-height:1.4;margin-top:3px">
      Fechado na <b>Série C</b>. O valor é o da divisão onde você assinou e <b>não muda</b> se subir ou cair.
      Nova proposta só quando o contrato acabar.</div>
  </div>`)

// ── o PONTUAL, agora em segundo, encolhido (é o de hoje, só renomeado) ─────
const pontual = quadro('#fff', `
  <div style="background:${INK};padding:8px 12px;color:#fff;display:flex;align-items:center;justify-content:space-between">
    <div style="${OSW};font-size:13px;color:${GOLD}">🤝 PATROCINADOR PONTUAL</div>
    <div style="font-family:system-ui;font-size:9px;font-weight:700;opacity:.7">SÓ ESTA TEMPORADA</div>
  </div>
  <div style="padding:9px 11px">
    <div style="font-family:system-ui;font-size:10px;font-weight:700;color:rgba(0,0,0,.6);margin-bottom:6px">Onde você quer chegar? <span style="color:${RED}">(a aposta de sempre)</span></div>
    <div style="display:flex;gap:5px">
      ${[['🛡️', 'Não cair', 8, '#EAF3FF'], ['📈', 'Acesso', 16, '#fff'], ['👑', 'Campeão', 24, '#fff']].map(([e, n, v, bg], i) => `
        <div style="flex:1;border:${i === 0 ? 3 : 2.5}px solid ${INK};border-radius:10px;background:${bg};padding:7px 4px;text-align:center">
          <div style="font-size:17px">${e}</div>
          <div style="${OSW};font-size:10px">${n}</div>
          <div style="${OSW};font-size:14px;margin-top:1px">+${v} 🪙</div>
        </div>`).join('')}
    </div>
    <div style="display:flex;gap:5px;margin-top:6px">
      ${[['🥖', 'Padaria do Zé'], ['🥩', 'Açougue'], ['💍', 'Max Joias']].map(([e, n], i) => `
        <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;background:${i === 2 ? '#FFF6DE' : '#FBF6E9'};padding:6px 3px;text-align:center">
          <div style="height:26px;display:flex;align-items:center;justify-content:center">${i === 2 ? `<img src="${L_MAX}" style="max-height:100%;max-width:100%;object-fit:contain">` : `<span style="font-size:19px">${e}</span>`}</div>
          <div style="${OSW};font-size:8.5px;margin-top:2px">${n}</div>
        </div>`).join('')}
    </div>
  </div>`)

const TELA_DIA = `${cab()}
  <div style="padding:11px">
    ${quadro('#E9F6EE', `<div style="padding:7px 11px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-family:system-ui;font-size:10px;font-weight:700">🛡️ Temporada passada: aposta certeira<br><span style="font-weight:600;color:rgba(0,0,0,.55)">Max Joias · não cair de divisão</span></div>
      <div style="${OSW};font-size:13px;background:${GREEN};color:#fff;border:2.5px solid ${INK};border-radius:8px;padding:2px 9px">+8 🪙</div></div>`)}
    ${masterCorrendo(MASTER[2], 'C', 2)}
    ${pontual}
    <div style="${OSW};font-size:14px;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:9px;text-align:center">▶ Começar a temporada</div>
  </div>`

// ── a PROPOSTA do master (só quando NÃO há contrato correndo) ──────────────
const oferta = (m, div, escolhida) => `
  <div style="border:${escolhida ? 4 : 2.5}px solid ${escolhida ? GOLD : INK};border-radius:13px;background:${escolhida ? '#FFFBEA' : '#fff'};box-shadow:${escolhida ? `3px 3px 0 ${INK}` : 'none'};padding:9px 10px;margin-bottom:7px;display:flex;align-items:center;gap:10px">
    <div style="width:40px;height:40px;border:2.5px solid ${INK};border-radius:9px;background:${m.cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:21px;flex:0 0 40px">${m.emoji}</div>
    <div style="flex:1">
      <div style="${OSW};font-size:13px;line-height:1.15">${m.nome}</div>
      <div style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.6)">contrato de <b>${m.anos}</b> temporada${m.anos > 1 ? 's' : ''} · total <b>${val(div, m.anos) * m.anos} 🪙</b></div>
    </div>
    <div style="text-align:right">
      <div style="${OSW};font-size:18px">+${val(div, m.anos)} 🪙</div>
      <div style="font-family:system-ui;font-size:8.5px;font-weight:700;color:rgba(0,0,0,.5)">por temporada</div>
    </div>
  </div>`

const TELA_PROPOSTA = `${cab()}
  <div style="padding:11px">
    ${quadro('#fff', `
      <div style="background:linear-gradient(150deg,#1b1b2e,#3b2d6e);padding:10px 12px;color:#fff;text-align:center">
        <div style="${OSW};font-size:9.5px;letter-spacing:.08em;color:${GOLD}">🏆 PATROCINADOR MASTER</div>
        <div style="${OSW};font-size:16px">Seu contrato acabou</div>
        <div style="font-family:system-ui;font-size:10px;font-weight:600;opacity:.8;line-height:1.4;margin-top:2px">Três empresas querem estampar a camisa. Escolha o <b>prazo</b> que você aguenta.</div>
      </div>
      <div style="padding:10px 11px">
        ${oferta(MASTER[0], 'C', false)}
        ${oferta(MASTER[2], 'C', true)}
        ${oferta(MASTER[4], 'C', false)}
        <div style="background:#FFF6DE;border:2.5px solid ${INK};border-radius:11px;padding:8px 10px;margin-top:3px">
          <div style="font-family:system-ui;font-size:10px;font-weight:700;line-height:1.45">
            ⚠️ O valor trava na <b>Série C</b>, onde você está hoje. Subiu pra B ou A? Continua recebendo o da C
            até o contrato acabar. Caiu pra D ou Várzea? <b>Também continua</b> — aí o contrato vira o seu colchão.
          </div>
        </div>
        <div style="${OSW};font-size:14px;background:${GOLD};border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};padding:9px;text-align:center;margin-top:9px">✍️ ASSINAR 3 TEMPORADAS</div>
      </div>`)}
    ${pontual}
  </div>`

// ── a aba Clube › Patrocínio, com o contrato correndo + as duas réguas ─────
const linha = (d, nome) => `
  <tr style="border-top:1.5px solid rgba(0,0,0,.12)">
    <td style="${OSW};font-size:10.5px;padding:4px 6px">${nome}</td>
    ${[1, 2, 3, 4, 5].map(a => `<td style="font-family:system-ui;font-size:10.5px;font-weight:700;text-align:center;padding:4px 3px;${a === 5 ? `color:${ROXO}` : ''}">${val(d, a)}</td>`).join('')}
  </tr>`

const TELA_ABA = `
  <div style="background:${INK};padding:10px 13px;color:#fff"><div style="${OSW};font-size:15px">🏟️ CLUBE</div></div>
  <div style="padding:11px">
    <div style="display:flex;gap:6px;margin-bottom:10px">
      <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;background:#fff;padding:6px;text-align:center;${OSW};font-size:10px">🏗️ ESTRUTURA</div>
      <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;background:#fff;padding:6px;text-align:center;${OSW};font-size:10px">💰 FINANÇAS</div>
      <div style="flex:1;border:2.5px solid ${INK};border-radius:9px;background:${ROXO};color:#fff;padding:6px;text-align:center;${OSW};font-size:10px">🤝 PATROCÍNIO</div>
    </div>
    ${masterCorrendo(MASTER[2], 'C', 2)}
    ${quadro('#fff', `
      <div style="background:#F1EDE0;padding:7px 10px;${OSW};font-size:11px">🏆 MASTER · QUANTO PAGA POR TEMPORADA</div>
      <div style="padding:8px 10px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td></td>${[1, 2, 3, 4, 5].map(a => `<td style="${OSW};font-size:9px;text-align:center;color:rgba(0,0,0,.55)">${a} TEMP</td>`).join('')}</tr>
          ${DIVS.map(([d, n]) => linha(d, n)).join('')}
        </table>
        <div style="font-family:system-ui;font-size:9.5px;font-weight:600;color:rgba(0,0,0,.6);line-height:1.45;margin-top:7px">
          <b>1 temporada</b> paga o mesmo que a aposta 🛡️ <b>não cair</b> da sua divisão. Cada temporada a mais no
          contrato soma <b>metade</b> desse valor. <b>5 temporadas</b> paga o mesmo que ser 👑 <b>campeão</b> pagaria —
          só que <b>garantido</b>, aconteça o que acontecer. O valor trava na divisão onde você assinou.
        </div>
      </div>`)}
    ${quadro('#fff', `
      <div style="background:#F1EDE0;padding:7px 10px;${OSW};font-size:11px">🤝 PONTUAL · A APOSTA DE SEMPRE</div>
      <div style="padding:8px 10px;font-family:system-ui;font-size:10px;font-weight:600;color:rgba(0,0,0,.6);line-height:1.45">
        Continua igualzinho: 2/4/6 na Várzea · 4/8/12 na D · 8/16/24 na C · 16/32/48 na B · 32/64/96 na A.
        Mesma fidelidade 🎖️, mesmas 9 marcas. Só mudou o <b>nome</b> e o <b>lugar</b> (agora embaixo do Master).
      </div>`)}
  </div>`

const html = `<html><head><meta charset="utf-8"><style>${FONTES}
body{margin:0;padding:34px;background:#DCD3BB;font-family:system-ui,sans-serif;color:${INK}}</style></head><body>

<h1 style="${OSW};font-size:30px;margin:0 0 4px">🏆 PATROCINADOR MASTER — proposta</h1>
<p style="font-family:system-ui;font-size:13.5px;font-weight:600;max-width:1180px;line-height:1.5;margin:0 0 26px;color:rgba(12,12,12,.72)">
O que você pediu: um patrocínio de <b>contrato</b>, de 1 a 5 temporadas, que <b>trava o valor na divisão onde foi assinado</b>
e paga todo ano até acabar — suba, caia, tanto faz. Ele aparece <b>em cima</b>, e o patrocínio de aposta de hoje vira
<b>Patrocinador Pontual</b>, embaixo. Os dois convivem: o Master é o <b>salário garantido</b> do clube, o Pontual é a
<b>aposta</b> daquela temporada.</p>

<div style="display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;margin-bottom:32px">
  ${fone(TELA_PROPOSTA, '① Quando o contrato acaba', GOLD.replace('#FFC400', '#8a6d00'),
    'Só nesta hora o Master aparece pra escolher. Três empresas, cada uma com um <b>prazo</b> diferente — foi como você descreveu. O aviso amarelo explica a trava ANTES de assinar.')}
  ${fone(TELA_DIA, '② O dia a dia (contrato correndo)', GREEN,
    'Nas outras temporadas o Master é só uma <b>faixa</b> em cima: quanto paga, em que ano está, quanto falta. Nada pra decidir — ele não atrasa o começo da temporada. Você só escolhe o <b>Pontual</b>.')}
  ${fone(TELA_ABA, '③ Clube › Patrocínio', ROXO,
    'A régua completa fica aqui, como já combinamos com o Pontual. Quem quiser ver, vê; quem quer jogar, joga.')}
  <div style="flex:1;min-width:430px;max-width:600px">
    ${bloco('💰 Os valores que eu sugiro', '#FFF6D6', `
      A régua inteira cabe em <b>uma frase</b>:<br><br>
      · <b>1 temporada</b> = o mesmo que a aposta 🛡️ <b>não cair</b> da sua divisão;<br>
      · cada temporada a mais soma <b>metade</b> desse valor;<br>
      · <b>5 temporadas</b> = exatamente o que 👑 <b>ser campeão</b> pagaria — só que garantido.<br><br>
      Na prática, por temporada: <b>Várzea</b> 2·3·4·5·6 · <b>D</b> 4·6·8·10·12 · <b>C</b> 8·12·16·20·24 ·
      <b>B</b> 16·24·32·40·48 · <b>A</b> 32·48·64·80·96.<br><br>
      Usei os números que o jogo <b>já tem</b> — não inventei escala nova. Assim o Master nunca fica
      absurdo perto do Pontual, e você sabe de cabeça quanto vale cada coisa.`)}
    ${bloco('🛡️ O que trava (e por quê)', '#EAF3FF', `
      · <b>O valor congela na divisão da assinatura.</b> Subiu? Continua o valor velho — foi o preço de
      ter garantido. Caiu? Continua o valor velho — é o colchão que segura o clube. Foi exatamente o que você pediu.<br>
      · <b>Proposta nova só quando o contrato acaba.</b> Não tem rescisão, não tem "trocar de master no meio" —
      senão o contrato não valeria nada.<br>
      · <b>O Master não atrapalha o ritmo</b>: na temporada em que ele está correndo não há nada pra apertar,
      é só uma faixa de leitura.<br>
      · <b>Carreira antiga entra sem susto</b>: quem nunca teve Master recebe a primeira proposta no
      começo da próxima temporada, como se o contrato anterior tivesse acabado.`)}
    ${bloco('❓ As 3 coisas que eu preciso que VOCÊ decida', '#FFE9E4', `
      <b>1) Na Série A o contrato longo é dinheiro de graça.</b> Em todas as outras divisões o prazo longo tem um
      custo (você trava um valor baixo e pode subir). Na A não tem pra onde subir, então todo mundo vai
      assinar 5 anos sempre. <b>Minha sugestão: na Série A o Master só oferece até 3 temporadas.</b> Ou deixamos
      solto mesmo — você decide.<br><br>
      <b>2) Os dois somam?</b> Eu montei somando (Master garantido + Pontual de aposta). Se achar que fica
      dinheiro demais, a outra saída é o Master <b>substituir</b> o Pontual enquanto durar.<br><br>
      <b>3) Os nomes das marcas.</b> Botei 📻 Rádio Grito de Gol (1 temp) · 🚚 Pé-de-Ferro Transportes (2) ·
      🏦 Banco Gol de Placa (3) · ✈️ AeroCraque (4) · ⚡ Trovão Energia (5). Se você quiser botar amigos seus
      aqui — como fez com Vadico, ERO, Max Joias e Rei das Tintas — é só falar os nomes.`)}
    ${bloco('↩️ Dá pra voltar atrás?', '#F1EDE0', `
      Dá. É uma feature nova em cima da que existe: o Pontual continua com os mesmos valores, as mesmas 9 marcas
      e a mesma fidelidade. Reverter o commit tira o Master e devolve o nome antigo, sem mexer em save de ninguém
      (o contrato fica guardado num campo novo e opcional — save velho abre normal).<br><br>
      <b>Nada disso está no código ainda</b> — isto é só o desenho, pro seu OK.`)}
  </div>
</div>

<p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
  <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-master-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1760, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
