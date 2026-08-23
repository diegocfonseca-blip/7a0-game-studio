// ─── 💛 MOCKUP: ÁREA DE APOIO EM TELA CHEIA (Diego 23/08) ────────────────────
//
// Pedido: *"vamos reformular a área de planos e sobre visual vc pense o que é
// melhor, mais organizado, clean e claro sobre tudo. E se possível EXPANDA ao
// invés de ficar numa janelinha quando apertar em Apoie"*.
//
// COMO É HOJE (screens.tsx, ApoieModal): janelinha de 390px de largura, com
// cada pacote numa SANFONA fechada — pra saber o que tem dentro do Craque você
// tem que tocar nele, e quando abre um você já não vê o outro. Resultado: dá
// pra passar por ali sem descobrir metade das coisas, e é impossível COMPARAR.
//
// AS 5 DECISÕES DE VISUAL (o que eu mudei e por quê):
//  1. TELA CHEIA de verdade (não modal): cabeçalho fixo com X, conteúdo rolando
//     por baixo. Espaço pra respirar, sem aquele aperto de 390px.
//  2. NADA ESCONDIDO: acabaram as sanfonas. Todo pacote mostra o que tem, de
//     cara. Quem quiser detalhe rola, quem quiser preço já vê no card.
//  3. SEPARAÇÃO CLARA "uma vez" × "por mês" — a dúvida nº1 de quem chega
//     ("vou ser cobrado todo mês?"). É a mesma divisão que o Diego usa no guia
//     dele. Cada preço leva o rótulo do que é, sempre.
//  4. TABELA DE COMPARAÇÃO: a peça que faltava. Numa olhada dá pra ver o que
//     vem em cada plano — é o "claro sobre TUDO" que ele pediu.
//  5. A HISTÓRIA DO DIEGO no fim, inteira. Ela converte mais que qualquer card
//     — mas vem DEPOIS de a pessoa entender o que está comprando, não antes.
//
// ⚠️ SÓ DESENHO — nada disto está no jogo. Aguardando OK visual do Diego.
//   node scripts/mockup-apoio-tela-cheia.mjs [--saida x.png]
import { chromium } from 'playwright-core'
import { readFileSync, statSync } from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'apoio-tela-cheia.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', ROXO = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const PRATA = 'linear-gradient(150deg,#F4F7FB,#CBD4DE 60%,#9BA7B5)'
const OURO = 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)'

// um item de benefício: ícone + texto (sem sanfona, tudo à vista)
const item = txt => `<div style="display:flex;gap:7px;align-items:flex-start;margin-top:5px">
  <span style="flex:none;color:${GREEN};font-weight:900;font-size:12px;line-height:1.35">✓</span>
  <span style="font-weight:700;font-size:11.5px;line-height:1.35">${txt}</span></div>`

const card = ({ grad, corTxt = INK, emoji, nome, preco, quando, resumo, itens, cta, ctaBg, ctaCor = INK, extra = '' }) => `
<div style="background:#fff;border:3.5px solid ${INK};border-radius:17px;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:13px">
  <div style="background:${grad};padding:11px 13px;position:relative;overflow:hidden;color:${corTxt}">
    <div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.42) 48%,transparent 62%);background-size:250% 250%"></div>
    <div style="display:flex;align-items:center;gap:8px;position:relative">
      <span style="${OSW};font-size:18px;text-transform:uppercase">${emoji} ${nome}</span>
      <span style="margin-left:auto;text-align:right">
        <span style="display:block;${OSW};font-size:17px;line-height:1">${preco}</span>
        <span style="display:block;font-weight:800;font-size:8.5px;text-transform:uppercase;letter-spacing:.06em;opacity:.8">${quando}</span>
      </span>
    </div>
    <p style="margin:4px 0 0;font-weight:700;font-size:11px;line-height:1.35;position:relative;opacity:.9">${resumo}</p>
  </div>
  <div style="padding:10px 13px 12px">
    ${itens.map(item).join('')}
    ${extra}
    <div style="background:${ctaBg};color:${ctaCor};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};${OSW};font-size:14px;text-align:center;text-transform:uppercase;padding:11px 8px;margin-top:11px">${cta}</div>
  </div>
</div>`

// tabela de comparação — a peça nova
const CMP = [
  ['Cor e brilho no nome', '💜 roxa', '⭐ prata', '👑 ouro', '👑 ouro'],
  ['Escudo + mascote seus', '✓', '—', '—', '✓'],
  ['Estádio batizado', '✓', '—', '—', '✓'],
  ['Moedas todo mês', '30 🪙', '—', '—', '30 🪙'],
  ['Modo Manual (ritmo)', '—', '✓', '✓', '✓'],
  ['Nível dos jogadores', '—', 'quase tudo', 'até lendas', 'até lendas'],
  ['Carreiras salvas', '2', '4', '6', '6'],
  ['Grupo VIP no zap', '—', '—', '✓', '✓'],
  ['Clube com SEU nome', '—', '—', '—', '✓'],
  ['Selo de Fundador', '—', '—', '—', '✓'],
]
const linhaCmp = ([o, s, c, l, b], i) => `
<tr style="background:${i % 2 ? '#FBF6E9' : '#fff'}">
  <td style="padding:6px 8px;font-weight:800;font-size:10px;border-top:1px solid rgba(0,0,0,.08)">${o}</td>
  ${[s, c, l, b].map(v => `<td style="padding:6px 3px;text-align:center;font-weight:800;font-size:9.5px;border-top:1px solid rgba(0,0,0,.08);color:${v === '—' ? 'rgba(0,0,0,.25)' : v === '✓' ? GREEN : INK}">${v}</td>`).join('')}
</tr>`

const html = `<style>${FONTES}
*{box-sizing:border-box} body{margin:0;background:#cfc8b4;font-family:system-ui,-apple-system,sans-serif;color:${INK};padding:20px 0}
.fone{width:430px;margin:0 auto;background:#F4ECD6;border:3px solid ${INK};border-radius:20px;overflow:hidden}
.topo{position:sticky;top:0;background:${INK};color:#fff;padding:12px 15px;display:flex;align-items:center;gap:10px}
.topo .t{${OSW};font-size:17px;text-transform:uppercase;color:${GOLD}}
.topo .x{margin-left:auto;border:2px solid rgba(255,255,255,.35);border-radius:9px;padding:2px 9px;${OSW};font-size:13px}
.corpo{padding:14px 15px 20px}
.regra{background:#EAF7EE;border:3px solid ${GREEN};border-radius:14px;padding:10px 12px;font-weight:700;font-size:11px;line-height:1.45;margin-bottom:16px}
.sec{display:flex;align-items:center;gap:8px;margin:4px 0 10px}
.sec .n{${OSW};font-size:15px;text-transform:uppercase}
.sec .tag{margin-left:auto;${OSW};font-size:9px;text-transform:uppercase;letter-spacing:.08em;border:2px solid ${INK};border-radius:999px;padding:2px 9px;background:#fff}
.combo{background:#FFF6DE;border:2.5px dashed ${INK};border-radius:11px;padding:8px 10px;margin-top:9px;font-weight:800;font-size:10.5px;line-height:1.4}
.cmp{background:#fff;border:3.5px solid ${INK};border-radius:17px;box-shadow:4px 4px 0 ${INK};overflow:hidden;margin-bottom:16px}
.cmp .cab{background:${INK};color:#fff;padding:9px 12px;${OSW};font-size:13px;text-transform:uppercase}
table{width:100%;border-collapse:collapse}
th{padding:6px 3px;font-size:9px;${OSW};text-transform:uppercase;background:#F4ECD6;border-bottom:2.5px solid ${INK}}
.hist{background:linear-gradient(160deg,#241d0c,#141414 60%,#1d1708);border:3.5px solid ${INK};border-radius:17px;box-shadow:4px 4px 0 ${INK};padding:13px 14px;color:rgba(255,255,255,.88)}
.hist h3{${OSW};font-size:16px;text-transform:uppercase;color:${GOLD};margin:0 0 7px}
.hist p{font-weight:700;font-size:11.5px;line-height:1.55;margin:0 0 7px}
.hist b{color:${GOLD}}
.gratis{display:flex;gap:9px;margin:14px 0 0}
.gratis div{flex:1;background:#fff;border:3px solid ${INK};border-radius:13px;box-shadow:3px 3px 0 ${INK};padding:9px 10px;font-weight:800;font-size:10.5px;line-height:1.35;text-align:center}
.nota{text-align:center;font-weight:700;font-size:10px;color:rgba(12,12,12,.5);margin-top:14px;line-height:1.5}
</style>
<div class="fone">
  <div class="topo"><span class="t">💛 Apoiar o Leilão Legends</span><span class="x">✕</span></div>
  <div class="corpo">
    <div class="regra">🛡️ <b>A regra de ouro:</b> o jogo é <b>grátis pra jogar</b>. Nada é tirado de ninguém e <b>nenhum apoio dá vantagem em campo</b> — dentro das quatro linhas todo mundo é igual. Quem apoia leva cor, brilho, história… e mantém o projeto vivo. 🔨</div>

    <div class="sec"><span class="n">⚡ Paga uma vez</span><span class="tag">é seu pra sempre</span></div>
    ${card({
      grad: PRATA, emoji: '⭐', nome: 'Craque', preco: 'R$ 19,90', quando: 'pagamento único',
      resumo: 'Pra quem quer dar um up no visual, mandar no ritmo do jogo e enxergar o nível do elenco.',
      itens: [
        '<b>Cor prata com brilho</b> no seu nome e no seu estádio — nas tabelas, no elenco e no online',
        '<b>Modo Manual:</b> pausa, acelera (2× ou 4×), pula rodada. Na carreira o ritmo é SEU',
        '<b>Nível dos jogadores revelado</b> no seu elenco depois de contratar (as lendas ficam em mistério)',
        '<b>4 carreiras salvas</b> ao mesmo tempo',
      ],
      cta: '⭐ Quero o Craque', ctaBg: PRATA,
      extra: '<div class="combo">🎁 Quer o <b>Sócio</b> junto (escudo, mascote, manto, estádio batizado, 30 🪙/mês)? Com o Craque ele sai por <b>R$ 4,90/mês</b> em vez de 9,90.</div>',
    })}
    ${card({
      grad: OURO, emoji: '👑', nome: 'Lenda', preco: 'R$ 39,90', quando: 'pagamento único',
      resumo: 'O pacote completo: status máximo, elenco sem segredo e acesso antecipado ao que vem por aí.',
      itens: [
        '<b>Tudo do Craque</b> — Modo Manual incluso',
        '<b>Cor ouro brilhante</b> (ou a cor que você quiser) + selo 👑 no nome pro jogo inteiro ver',
        '<b>Nível de TODOS revelado — até as lendas</b>, sempre depois da contratação',
        '<b>Grupo VIP no WhatsApp</b> com o criador: bastidores e novidades antes de todo mundo',
        '<b>Criar Ligas</b> entre amigos e entrar nos modos novos assim que saem',
        '<b>6 carreiras salvas</b>',
      ],
      cta: '👑 Quero ser Lenda', ctaBg: OURO,
      extra: '<div class="combo">🎁 Já é ⭐ Craque? Vira Lenda pagando só a diferença: <b>+ R$ 20</b>.<br>🎫 E o <b>Sócio</b> junto da Lenda sai por <b>R$ 2,90/mês</b>.</div>',
    })}
    ${card({
      grad: 'linear-gradient(150deg,#2b2b2b,#0C0C0C)', corTxt: GOLD, emoji: '🖋️', nome: 'Batismo', preco: 'R$ 59,90', quando: 'a partir de · uma vez',
      resumo: 'Seu nome vira um CLUBE do jogo — na tela de todo mundo, temporada após temporada.',
      itens: [
        '<b>Um time com o SEU nome</b> na pirâmide: joga, sobe, briga por título e sai no jornal',
        '<b>Escudo e mascote desenhados</b> pra você — a mascote carimba a tela quando seu time faz gol',
        '<b>Tudo do 👑 Lenda + o 🎫 Sócio inclusos</b>, sem pagar à parte',
        '<b>Selo de Fundador</b> e nome no mural dos 100 — o único caminho pra ele',
        'Série A · B · C e Várzea: R$ 59,90 &nbsp;·&nbsp; Série D (os rivais de todo mundo): R$ 69,90',
      ],
      cta: '🖋️ Quero batizar meu clube', ctaBg: '#141414', ctaCor: GOLD,
    })}

    <div class="sec" style="margin-top:20px"><span class="n">💳 Assinatura mensal</span><span class="tag">cancela quando quiser</span></div>
    ${card({
      grad: 'linear-gradient(150deg,#A78BFA,#7C3AED)', corTxt: '#fff', emoji: '🎫', nome: 'Sócio Legends', preco: 'R$ 9,90', quando: 'por mês',
      resumo: 'O apoio que anda com você todo mês — e devolve em cor, história e moeda.',
      itens: [
        '<b>Escudo e mascote personalizados</b> — e a mascote faz festa quando você é campeão',
        '<b>Estádio batizado</b> com o nome que você escolher, no clube e no jornal',
        '<b>Manto do coração:</b> seu elenco ganha a faixinha com as cores do seu time',
        '<b>Cor roxa</b> no nome + carteirinha de sócio numerada',
        '<b>30 moedas todo mês</b> na caixa do clube, em qualquer carreira sua',
      ],
      cta: '🎫 Quero ser sócio', ctaBg: 'linear-gradient(150deg,#A78BFA,#7C3AED)', ctaCor: '#fff',
      extra: '<div class="combo">💳 Cartão pelo Mercado Pago · cancela quando quiser, sem multa.<br>Mais barato pra quem já apoiou: ⭐ Craque <b>R$ 4,90</b> · 👑 Lenda <b>R$ 2,90</b>.</div>',
    })}

    <div class="cmp">
      <div class="cab">📊 O que vem em cada um</div>
      <table>
        <thead><tr><th style="text-align:left;padding-left:8px">&nbsp;</th><th>🎫 Sócio</th><th>⭐ Craque</th><th>👑 Lenda</th><th>🖋️ Batismo</th></tr></thead>
        <tbody>${CMP.map(linhaCmp).join('')}</tbody>
      </table>
      <p style="margin:0;padding:8px 10px;font-weight:700;font-size:9.5px;line-height:1.45;color:rgba(0,0,0,.55);border-top:2px solid rgba(0,0,0,.08)">O 🎫 Sócio é o único mensal — os outros três são pagamento único. E o nível dos jogadores só aparece <b>depois</b> de contratar: no leilão é emoção pura pra todo mundo.</p>
    </div>

    <div class="hist">
      <h3>Quem faz isso aqui 🔴⚫</h3>
      <p>Sou o <b>Diego</b>. De dia vendo carro com meu pai. De madrugada, quando a casa dorme, faço este jogo — <b>sozinho, na unha</b>.</p>
      <p>E faço por um motivo com nome: o <b>Luca</b>, meu filho. Ele tem uma condição rara — são <b>120 casos no mundo</b> — e é o menino mais forte que eu conheço. Cada apoio vira <b>uma vida melhor pro Luca</b> e este jogo vivo, crescendo toda semana.</p>
      <p style="margin-bottom:0">E essa história, que é minha e do Luca, passa a ter <b>um pedaço de você</b> dentro dela.</p>
    </div>

    <div class="gratis">
      <div>💛 <b>Só apoiar a resenha</b><br><span style="font-weight:700;color:rgba(0,0,0,.55)">qualquer valor no Pix</span></div>
      <div>🆓 <b>Sem grana?</b><br><span style="font-weight:700;color:rgba(0,0,0,.55)">seguir no Instagram já ajuda demais</span></div>
    </div>
    <p class="nota">Dúvida em qualquer coisa? Chama no 📲 @leilaolegendscom.</p>
  </div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 470, height: 1000 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: SAIDA, fullPage: true })
await browser.close()
console.log(`${SAIDA} · ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`)
