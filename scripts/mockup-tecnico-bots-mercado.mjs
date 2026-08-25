// ─── 🎩 TÉCNICO PRA TODO MUNDO: 100 CLUBES, 100 TÉCNICOS (Diego 24/08) ─────
//
// Pedido: *"preciso de algo q os bots e rivais tb tenham técnicos e como seria
// a compra deles e etc"*.
//
// 🔢 O NÚMERO QUE FECHA A IDEIA (conferido no código): a pirâmide tem
// `roundRobin(20)` × 5 divisões (`DIVS = A,B,C,D,V`) = **100 CLUBES**.
// E ele quer **100 TÉCNICOS**. É 1 pra 1 — cada clube tem o seu, e não sobra
// nenhum no banco. Isso transforma a contratação num MERCADO DE VERDADE:
// pra ter um técnico, você tira ele de alguém.
//
// 🚨 A TRAVA DE SEGURANÇA MAIS IMPORTANTE DESTA ENTREGA: se os bots ganham
// bônus, TODOS os resultados de TODAS as carreiras salvas mudariam. Por isso
// isto nasce atrás de `tecnicosOn`, o MESMO padrão de `contratosOn` (types.ts
// linha 529) e `agenciaOn` (534): só carreira NOVA nasce com técnico; save
// antigo NUNCA ganha, e nada muda no meio da carreira de ninguém.
//
//   node scripts/mockup-tecnico-bots-mercado.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'tecnico-bots.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED', BLUE = '#2F6BAE'
const CREME = '#F4ECD6'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const box = (bg = '#fff') => `border:3px solid ${INK};border-radius:16px;background:${bg};box-shadow:4px 4px 0 0 ${INK}`

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 356px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.05em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px;min-height:46px">${nota}</div>
  <div style="width:356px;border:5px solid ${INK};border-radius:24px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

const cabecinha = (tit, sub) => `
  <div style="background:${INK};padding:9px 12px;color:#fff;display:flex;justify-content:space-between;align-items:center">
    <span style="${OSW};font-size:12px">${tit}</span>
    <span style="font-family:system-ui;font-size:8.5px;font-weight:800;color:rgba(255,255,255,.5)">${sub}</span>
  </div>`

// ── ① a pirâmide: 100 clubes, 100 técnicos ────────────────────────────────
const DIVISOES = [
  ['A', 'Série A', 20, 'linear-gradient(160deg,#FFE79A,#FFC400)', INK, '👑 lendas e craques mandam aqui'],
  ['B', 'Série B', 20, 'linear-gradient(160deg,#F4F7FB,#CBD4DE)', INK, '⭐ craques e bons'],
  ['C', 'Série C', 20, 'linear-gradient(160deg,#41C07A,#2E9E5B)', '#fff', '🟢 bons e profissionais'],
  ['D', 'Série D', 20, 'linear-gradient(160deg,#7FB2E5,#2F6BAE)', '#fff', '🔵 profissionais'],
  ['V', 'Várzea', 20, 'linear-gradient(160deg,#EFE9D6,#CBBF9E)', INK, '⚪ estreantes — é onde eles começam'],
]
const linhaDiv = ([k, nome, n, grad, cor, nota]) => `
  <div style="display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1.5px solid rgba(0,0,0,.1)">
    <span style="flex:none;width:30px;height:30px;border-radius:9px;border:2.5px solid ${INK};background:${grad};color:${cor};
      display:flex;align-items:center;justify-content:center;${OSW};font-size:14px">${k}</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-size:12.5px;margin:0;text-transform:uppercase">${nome}</p>
      <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:1px 0 0">${nota}</p>
    </div>
    <span style="${OSW};font-size:14px;flex:none">${n} 🎩</span>
  </div>`

const PIRAMIDE = `
  <div style="${box('#fff')};padding:13px">
    <p style="${OSW};font-size:15px;margin:0 0 2px">🔢 100 clubes · 100 técnicos</p>
    <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.55);margin:0 0 4px;line-height:1.4">
      Conferi no código: a pirâmide é <b>20 times × 5 divisões</b>. Bate CERTINHO com os 100 que você quer —
      um técnico por clube, <b>sem sobra no banco</b>.</p>
    ${DIVISOES.map(linhaDiv).join('')}
    <div style="border-top:2.5px solid ${INK};margin-top:6px;padding-top:8px;display:flex;justify-content:space-between;align-items:center">
      <span style="${OSW};font-size:13px;text-transform:uppercase">Total</span>
      <span style="${OSW};font-size:18px;color:${GREEN}">100 🎩</span>
    </div>
  </div>`

// ── ② a tela do mercado (com dono) ────────────────────────────────────────
const candidato = (ic, nome, tier, cor, setor, clube, preco, obs, destaque) => `
  <div style="${box(destaque ? '#FFF6D6' : '#fff')};padding:9px 10px;margin-bottom:7px">
    <div style="display:flex;gap:8px;align-items:center">
      <span style="flex:none;width:30px;height:30px;border-radius:9px;border:2.5px solid ${INK};background:${cor};
        display:flex;align-items:center;justify-content:center;font-size:14px">${ic}</span>
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:12.5px;margin:0;text-transform:uppercase">${nome}
          <span style="font-size:8px;border:2px solid ${INK};border-radius:999px;padding:0 6px;background:${cor};margin-left:3px">${tier}</span></p>
        <p style="font-family:system-ui;font-size:9.5px;font-weight:800;color:${GREEN};margin:2px 0 0">${setor}</p>
      </div>
    </div>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.55);margin:5px 0 0">
      🏟️ hoje no <b>${clube}</b></p>
    <p style="font-family:system-ui;font-size:9.5px;font-weight:700;margin:3px 0 0">
      <span style="color:#B8860B">${preco}</span> · <span style="color:rgba(0,0,0,.5)">${obs}</span></p>
  </div>`

const MERCADO = `${cabecinha('🎩 MERCADO DE TÉCNICOS', 'PRÉ-TEMPORADA · T7')}
  <div style="padding:11px">
    <div style="${box('#EDE7FF')};padding:9px 10px;margin-bottom:9px;font-family:system-ui;font-size:10.5px;font-weight:800;line-height:1.4">
      🎩 Seu técnico hoje: <b>O Estreante</b> (+3 nos meias) · contrato acaba nesta temporada.</div>
    ${candidato('🧱', 'O Muralha', '🟢', 'linear-gradient(160deg,#41C07A,#2E9E5B)', '+3 nos ZAGUEIROS', 'Grêmio Serrano (Série C)', '🪙 90 de multa', 'tem contrato — tem que pagar', 0)}
    ${candidato('⚔️', 'O Artilheiro', '⭐', 'linear-gradient(160deg,#F4F7FB,#CBD4DE)', '+3 nos ATACANTES', 'seu RIVAL, o Fúria FC', '🪙 180 de multa', '⚔️ tirar do rival custa DOBRO', 0)}
    ${candidato('🎓', 'O Professor', '🔵', 'linear-gradient(160deg,#7FB2E5,#2F6BAE)', '+3 nos LATERAIS', 'ninguém — foi demitido', '🪙 20 de luvas', '✅ livre no mercado, sai barato', 1)}
    <div style="${box('#E3EEF9')};padding:9px 10px;margin-top:9px;font-family:system-ui;font-size:10px;font-weight:700;line-height:1.45">
      💡 Só aparecem os que <b>aceitam a Série C</b>. Lenda não atende clube de série pequena — nem por dinheiro.</div>
    <div style="display:flex;gap:6px;margin-top:9px">
      <div style="flex:1;background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};
        padding:9px 0;text-align:center;${OSW};font-size:12px">✅ CONTRATAR</div>
      <div style="flex:none;background:#fff;border:3px solid ${INK};border-radius:11px;box-shadow:3px 3px 0 ${INK};
        padding:9px 12px;${OSW};font-size:12px">fico com o meu</div>
    </div>
  </div>`

// ── ③ a roda do mercado (o que os bots fazem) ─────────────────────────────
const passo = (n, tit, txt, cor) => `
  <div style="display:flex;gap:9px;margin-bottom:9px">
    <span style="flex:none;width:24px;height:24px;border-radius:999px;background:${cor};color:#fff;
      display:flex;align-items:center;justify-content:center;${OSW};font-size:12px">${n}</span>
    <div style="min-width:0">
      <p style="${OSW};font-size:12.5px;margin:0;text-transform:uppercase">${tit}</p>
      <p style="font-family:system-ui;font-size:10.5px;font-weight:700;color:rgba(0,0,0,.58);margin:2px 0 0;line-height:1.4">${txt}</p>
    </div>
  </div>`

const RODA = `${cabecinha('🔄 A DANÇA DAS CADEIRAS', 'ACONTECE NA VIRADA DA TEMPORADA')}
  <div style="padding:12px">
    ${passo(1, 'Os bots demitem', 'Time que foi mal (rebaixado ou última metade) <b>demite o técnico</b>. Ele cai no mercado livre.', RED)}
    ${passo(2, 'Os bots contratam', 'Quem subiu de divisão pega um técnico melhor — <b>e pode roubar o seu</b> se o contrato dele acabou.', BLUE)}
    ${passo(3, 'A sua vez', 'Aí abre a sua tela: você vê quem sobrou livre e quem dá pra tirar de outro clube, pagando a multa.', GREEN)}
    ${passo(4, 'O jornal conta tudo', '"Fúria FC anuncia O Artilheiro" · "O Professor é demitido após queda". Vira resenha sozinho.', PURPLE)}
    <div style="${box('#FFF0EC')};padding:10px 11px;margin-top:4px;font-family:system-ui;font-size:10.5px;font-weight:700;line-height:1.45">
      ⚔️ <b>O RIVAL É O TEMPERO:</b> tirar técnico do seu rival custa <b>o dobro</b> — e o jornal <b>esfrega na cara dele</b>.
      É a briga que o jogo já tem (rival fixo), agora com uma disputa a mais.</div>
  </div>`

const bloco = (tit, bg, txt) => `
  <div style="border:4px solid ${INK};border-radius:18px;background:${bg};box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:14px">
    <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">${tit}</div>
    <div style="font-family:system-ui;font-size:12.5px;font-weight:600;line-height:1.55">${txt}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${CREME};padding:34px 34px 28px;font-family:system-ui}</style>
<body>
  <div style="display:inline-block;background:${PURPLE};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🎩 100 CLUBES · 100 TÉCNICOS · 1 PRA 1</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:43px;margin:14px 0 6px;line-height:1">
    PRA TER UM, VOCÊ <span style="color:${RED}">TIRA DE ALGUÉM</span></h1>
  <p style="font-size:14.5px;font-weight:600;max-width:1200px;line-height:1.5;margin:0 0 22px">
    Fui conferir e o número fecha sozinho: a pirâmide tem <b>20 times × 5 divisões = 100 clubes</b>, e você quer
    <b>100 técnicos</b>. Um pra cada. <b>Não sobra ninguém no banco</b> — e é isso que faz virar mercado de verdade
    em vez de loja: pra contratar, você tira de outro clube (pagando multa) ou pega quem foi demitido.
  </p>

  <div style="display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap;margin-bottom:26px">
    <div style="flex:0 0 356px">${PIRAMIDE}</div>
    ${fone(MERCADO, '② a sua tela', GREEN, 'Cada candidato mostra <b>de quem ele é hoje</b> e quanto custa tirar. O barato é quem está desempregado.')}
    ${fone(RODA, '③ o que os bots fazem', BLUE, 'Antes de você escolher, os 99 outros clubes já se mexeram. Você entra num mercado que JÁ aconteceu.')}
    <div style="flex:1;min-width:390px">
      ${bloco('🚨 A TRAVA DE SEGURANÇA (o mais importante daqui)', '#FFF0EC', `
        Se os bots ganham bônus, <b>TODOS os resultados de TODAS as carreiras salvas mudariam</b> —
        campeão, rebaixado, artilheiro, tudo.<br><br>
        Por isso isto nasce atrás de <code>tecnicosOn</code>, <b>o mesmo padrão que já existe</b> pro
        <code>contratosOn</code> e o <code>agenciaOn</code>: <b>só carreira NOVA nasce com técnicos</b>.
        Save antigo nunca ganha, e <b>nada muda no meio da carreira de ninguém</b>.<br><br>
        Reverter = desligar a chave. A carreira volta a ser exatamente o que é hoje.`)}
      ${bloco('🤖 Como o bot usa o técnico dele', '#E3EEF9', `
        <b>1. Ele joga a formação do técnico.</b> Hoje TODO bot joga no padrão 4-3-3. Com técnico, cada um
        joga o esquema do seu — <b>a liga inteira fica mais variada</b> de graça.<br><br>
        <b>2. Ele leva o mesmo +3 no setor</b> do técnico dele. Nada de bot com regra secreta: mesma conta
        pra todo mundo (sua lei do "saber o que pode e o que não pode").<br><br>
        <b>3. Dá pra ESPIAR.</b> Na tabela, o escudo do time mostra o chapéu do técnico. Você olha o próximo
        adversário e sabe onde ele é forte — <b>e aí escolher a sua formação vira leitura de jogo</b>.`)}
      ${bloco('💰 O preço, em 3 regras simples', '#E6F3EA', `
        · <b>Desempregado</b> (foi demitido): só as <b>luvas</b>, baratíssimo. É o caminho de quem tem pouca moeda.<br>
        · <b>Empregado</b>: paga a <b>multa</b> pro clube dele. Quanto melhor o tier e maior a divisão, mais caro.<br>
        · <b>Do RIVAL</b>: <b>dobro</b> da multa. Caro de propósito — e o jornal transforma isso em treta.<br><br>
        Depois disso, todo mês entra o <b>salário na folha</b> (o <code>squadPayroll</code> que já existe).`)}
      ${bloco('🌎 DE ONDE VÊM OS 100 (Brasil e mundo)', '#FFF6D6', `
        Você disse: <i>"é técnico do Brasil e mundo todo pow"</i>. E o jogo já resolve isso sozinho —
        <b>na CARREIRA o baralho SEMPRE é Brasileirão + Europa + Mundo juntos</b> (~850 nomes), porque
        precisa dos três pra encher os 100 times. <b>Os técnicos seguem o mesmo caminho</b>: um pote só,
        misturado, igual aos jogadores.<br><br>
        <b>⚠️ Mas tem um cuidado seu aqui</b>, e é sua regra de 18/08: <i>"não inventar como uma pessoa real é"</i>.<br>
        · <b>~45 com NOME REAL</b> — só onde o jeito dele é <b>fato público e conhecido</b> (Telê = futebol-arte,
        Pep = posse, Bielsa = marcação alta, Luxemburgo = mercado). Aí não invento nada, só uso o que a
        história já registrou.<br>
        · <b>~55 FOLCLÓRICOS</b> — nomes inventados no espírito do jogo ("Seu Zé do Sacolão", "Professor
        Pardal", "O Xerife"). <b>Sua própria regra diz que folclórico é melhor que nome real em conteúdo
        inventado</b> — e aqui eles carregam a zoeira sem risco nenhum.`)}
      ${bloco('🙋 Me responde', '#fff', `
        <b>1.</b> Fecha <b>1 técnico por clube</b> (100 e 100), com mercado por multa?<br>
        <b>2.</b> Fecha a <b>dança das cadeiras</b> na virada (bots demitem e contratam ANTES de você)?<br>
        <b>3.</b> Fecha o <b>dobro pra tirar do rival</b>?<br>
        <b>4.</b> Fecha a trava <code>tecnicosOn</code> — <b>só carreira nova</b>? (essa eu recomendo MUITO:
        sem ela, toda carreira em andamento muda de resultado)<br>
        <b>5.</b> Fecha a mistura <b>~45 reais + ~55 folclóricos</b>?<br><br>
        Fechando, o próximo passo é eu escrever <b>os 100 técnicos</b> (nome · tier · setor · formações) num
        documento pra você aprovar nome por nome, antes de qualquer código.`)}
    </div>
  </div>

  <p style="${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-tecbots-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
