// 🎬 MOCKUP — A VIRADA DA TEMPORADA EM 5 PASSOS PADRONIZADOS (pedido do Diego, 15/09)
//
// Palavras dele: *"quero padronizado passo a passo igual já ocorre hoje quando abre
// patrocinador Master, depois patrocinador pontual, depois material esportivo, depois
// venda de camisas e depois o bico! Lembrando que o bico, depois de escolhido, só troca
// se subir de divisão ou cair — mesma coisa com os outros patrocinadores que têm
// contratos longos. Certo mesmo aparecer toda temporada é o Pontual e a venda de
// camisas… Mas quero visuais parecidos com o que já existe hoje. Na arte da camisa
// seria ideal ter o mesmo estilo de arte, porém aparecendo a camisa MAIOR. E o bico,
// mesmo estilo também, só que em vez do papel seria uma CARTEIRA DE TRABALHO do Brasil"*.
//
// ⛔ E ele ENCERROU a ideia de juntar o Pontual com a venda de camisas: *"a ideia é
// diferente, porque no Pontual quando não bate a meta não ganha nada; já nas camisas
// ganha — só não ganha se cair. Acredito que deva separar mesmo"*. É exatamente o
// formato de risco que o mockup anterior mostrou. **Ficam separadas.**
//
// O molde que TODOS os 5 passos usam já existe no jogo (`ll29-sponsor ll36-sponsor`,
// `career-sponsor-office.css`): cabeçalho escuro → as opções → a CENA → barra de baixo
// com a explicação e o botão de assinar. Aqui os dois passos novos entram nesse molde:
//   · 🛍️ venda de camisas → a cena é a VITRINE com a camisa grande
//   · 🕴️ bico de folga   → a cena é uma CARTEIRA DE TRABALHO aberta (0 KB, desenhada
//     em CSS: a regra de peso do repo proíbe arte nova em arquivo sem necessidade)
//
// Rodar: node scripts/mockup-virada-passos.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { camisa, img, LOGO_VADICO, FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-virada-passos.png')
const VERM = '#C2452F', ROXO = '#7C3AED', AZUL_CT = '#16233F'
const ESCRITORIO = img('src/escalacao/img/career-sponsor-office-v36.webp')

// ── o molde de tela que TODOS os passos usam ────────────────────────────────
// (cabeçalho escuro · opções · cena · barra de baixo) — é o `ll36-sponsor` de hoje
const molde = ({ passo, total, chapeu, titulo, lead, opcoes, cena, explica, botao, rodape }) => `
  <div style="border:4px solid ${INK};border-radius:20px;overflow:hidden;box-shadow:5px 5px 0 ${INK};background:#160e08">
    <div style="background:linear-gradient(#07120d,#0b1a14);padding:11px 14px 12px;position:relative">
      <div style="display:inline-block;background:${GOLD};color:${INK};border:3px solid ${INK};border-radius:999px;
        padding:2px 12px;${OSW};font-weight:700;font-size:10.5px;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:6px">
        passo ${passo} de ${total}</div>
      <div style="${OSW};font-weight:400;font-size:9.5px;letter-spacing:1.6px;color:rgba(244,236,214,.55)">${chapeu}</div>
      <div style="${OSW};font-weight:700;font-size:25px;line-height:1.02;color:#F4ECD6;text-transform:uppercase;margin-top:1px">${titulo}</div>
      <div style="${OSW};font-weight:400;font-size:11px;line-height:1.35;color:rgba(244,236,214,.78);margin-top:4px">${lead}</div>
    </div>
    ${opcoes ? `<div style="padding:11px 12px 10px;background:#160e08">${opcoes}</div>` : ''}
    ${cena}
    <div style="background:linear-gradient(#231409,#100b07);padding:11px 13px 13px">
      <div style="${OSW};font-weight:400;font-size:10.5px;line-height:1.42;color:rgba(244,236,214,.85)">${explica}</div>
      <div style="margin-top:9px;border:3px solid ${INK};border-radius:12px;background:${GOLD};box-shadow:3px 3px 0 ${INK};
        padding:10px 0;text-align:center;${OSW};font-weight:700;font-size:14px;text-transform:uppercase">${botao}</div>
      <div style="${OSW};font-weight:400;font-size:9.5px;color:rgba(244,236,214,.5);text-align:center;margin-top:7px;line-height:1.35">${rodape}</div>
    </div>
  </div>`

// ── PASSO 1 (o que JÁ EXISTE) — a cena do escritório, pra comparar o estilo ──
const cenaEscritorio = `
  <div style="position:relative;aspect-ratio:1;background:url('${ESCRITORIO}') center/100% 100% no-repeat">
    <div style="position:absolute;left:24%;top:49%;width:51%;height:36%;display:flex;flex-direction:column;
                align-items:center;justify-content:center;gap:5px;text-align:center;color:${INK}">
      <img src="${img('src/escalacao/img/patro-vadico.webp')}" style="width:62%;height:40px;object-fit:contain">
      <div style="${OSW};font-weight:700;font-size:20px;line-height:1.1">Vadico Veículos</div>
      <div style="${OSW};font-weight:700;font-size:11px">5 temporadas · 130 no total · Série C</div>
      <div style="${OSW};font-weight:700;font-size:23px;line-height:1.1">+26/TEMPORADA</div>
      <div style="align-self:stretch;border-top:1px solid #897b5d;margin-top:4px;padding-top:3px;
                  font-family:Arial;font-size:9px;color:#62573f">Assinatura do presidente</div>
    </div>
  </div>`

// ── PASSO 4 (NOVO) — a vitrine com a camisa GRANDE ──────────────────────────
const CAMISA_GRANDE = camisa({
  arte: img('public/mantos-salao/finalboss-camisa.webp'), alt: 300, escudo: '',
  fornecedor: 'Naique', fornSimbolo: '✓', master: '', masterLogo: LOGO_VADICO,
  masterW: 0.22, masterH: 0.155, masterCor: INK,
  pos: { fornX: 30, fornY: 27, masterX: 50, masterY: 58 },
})
// a cena da loja: mesma luz quente da vitrine de hoje, mas do tamanho da cena do
// escritório — é aqui que mora o *"aparecendo a camisa maior"*
const cenaVitrine = `
  <div style="position:relative;aspect-ratio:1;overflow:hidden;background:
      radial-gradient(120% 62% at 50% 2%, rgba(255,213,120,.46) 0%, rgba(255,196,0,.12) 36%, transparent 64%),
      linear-gradient(#2A1B10 0%, #40281680 32%, #140C06 100%),
      repeating-linear-gradient(90deg,#3A2414 0 30px,#331F11 30px 60px)">
    <div style="position:absolute;inset:0 0 auto;height:42px;background:linear-gradient(#0B0704,#0B070400);opacity:.9"></div>
    <div style="position:relative;text-align:center;padding:12px 0 0">
      <span style="${OSW};font-weight:700;font-size:12px;letter-spacing:.26em;color:#F0DFAE;text-transform:uppercase;
                   text-shadow:0 1px 0 #000">· Loja do Clube ·</span>
    </div>
    <div style="position:relative;display:flex;justify-content:center;margin-top:6px;
                filter:drop-shadow(0 20px 22px rgba(0,0,0,.6))">
      ${CAMISA_GRANDE}
      <!-- 🏷️ a etiqueta de preço pendurada, que é a decisão desta tela -->
      <div style="position:absolute;right:16%;top:16%;transform:rotate(7deg);background:${GOLD};border:3px solid ${INK};
                  border-radius:10px;box-shadow:3px 3px 0 ${INK};padding:5px 11px;text-align:center">
        <div style="${OSW};font-weight:400;font-size:8.5px;letter-spacing:1.2px;text-transform:uppercase">preço</div>
        <div style="${OSW};font-weight:700;font-size:20px;line-height:1">3 🪙</div>
        <div style="${OSW};font-weight:700;font-size:9px;text-transform:uppercase">cara</div>
      </div>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:64px;background:linear-gradient(#150C0600,#150C06 60%);
                border-top:3px solid #54351C"></div>
    <div style="position:absolute;left:0;right:0;bottom:12px;text-align:center">
      <span style="${OSW};font-weight:700;font-size:13px;color:#F0DFAE">
        ~2.400 camisas · <span style="color:#7BD79B">+25 🪙</span> <span style="font-weight:400;font-size:10px;opacity:.75">se for campeão</span></span>
    </div>
  </div>`

// os 3 preços, no formato dos "papéis" do Master
const precoPapel = (nome, moeda, quando, sel) => `
  <div style="flex:1;border:3px solid ${sel ? ROXO : INK};outline:${sel ? `3px solid ${ROXO}` : 'none'};outline-offset:1px;
              border-radius:6px;background:#f6efdc;box-shadow:3px 3px 0 ${sel ? INK : 'rgba(0,0,0,.55)'};
              padding:8px 5px 7px;text-align:center">
    <div style="${OSW};font-weight:400;font-size:7.5px;letter-spacing:.08em;text-transform:uppercase">preço da camisa</div>
    <div style="${OSW};font-weight:700;font-size:17px;line-height:1.05;margin-top:3px">${nome}</div>
    <div style="display:inline-block;${OSW};font-weight:700;font-size:11px;background:${INK};color:${GOLD};
                border-radius:5px;padding:1px 8px;margin-top:3px">${moeda} 🪙</div>
    <div style="${OSW};font-weight:700;font-size:10px;color:${GREEN};margin-top:5px;line-height:1.15">${quando}</div>
  </div>`

// ── PASSO 5 (NOVO) — a CARTEIRA DE TRABALHO aberta ──────────────────────────
// 🇧🇷 Desenhada em CSS (0 KB). Não é cópia de documento oficial: é a brincadeira da
// carteirinha azul — a regra permanente do Diego é não inventar coisa de gente ou
// instituição real com cara de verdadeira.
// 👷 No lugar do brasão vai o EMOJI DE TRABALHADOR. Era a bola do jogo e ele cortou
// (15/09): *"na arte da carteira de trabalho não coloque a logo de uma bola na
// carteira, coloque um emoji de trabalhador ou obras"*. Faz sentido: a carteira é do
// bico, não do clube — bola ali confundia as duas coisas.
const cenaCarteira = `
  <div style="position:relative;aspect-ratio:1;overflow:hidden;background:
      radial-gradient(110% 60% at 50% 6%, rgba(255,213,120,.26) 0%, transparent 60%),
      linear-gradient(#241a12,#100a06);display:flex;align-items:center;justify-content:center;padding:18px">
    <div style="display:flex;border:4px solid #0A1024;border-radius:9px;box-shadow:0 16px 22px rgba(0,0,0,.6);
                transform:rotate(-1.5deg);overflow:hidden">
      <!-- capa azul -->
      <div style="width:150px;background:linear-gradient(145deg,${AZUL_CT},#0E1830);padding:14px 11px;text-align:center;
                  border-right:3px solid #0A1024">
        <div style="width:46px;height:46px;margin:2px auto 8px;border:3px solid ${GOLD};border-radius:999px;
                    display:flex;align-items:center;justify-content:center;font-size:22px">👷</div>
        <div style="${OSW};font-weight:700;font-size:11px;line-height:1.15;color:${GOLD};letter-spacing:.06em">CARTEIRA<br>DE TRABALHO</div>
        <div style="${OSW};font-weight:400;font-size:7.5px;line-height:1.25;color:rgba(255,255,255,.62);margin-top:5px;
                    letter-spacing:.06em">REGISTRO DO<br>BICO DE FOLGA</div>
        <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,.22);padding-top:7px;
                    ${OSW};font-weight:400;font-size:7.5px;color:rgba(255,255,255,.5)">Nº 0007-2029</div>
      </div>
      <!-- página de dentro -->
      <div style="width:196px;background:#F6EFDC;padding:11px 12px 10px">
        <div style="${OSW};font-weight:700;font-size:8px;letter-spacing:.1em;text-align:center;color:#6b6552;
                    border-bottom:1px solid #b9ab8a;padding-bottom:4px">CONTRATO DE TRABALHO</div>
        ${[['EMPREGADOR', 'Vadico Veículos'], ['CARGO', 'gerente da loja'], ['ADMISSÃO', 'T7 · Série C']].map(([k, v]) => `
          <div style="margin-top:7px">
            <div style="${OSW};font-weight:400;font-size:7px;letter-spacing:.08em;color:#8a7f63">${k}</div>
            <div style="${OSW};font-weight:700;font-size:12.5px;line-height:1.15;border-bottom:1px solid #c9bb99;padding-bottom:2px">${v}</div>
          </div>`).join('')}
        <div style="margin-top:8px;text-align:center;border:2px solid ${INK};border-radius:7px;background:#fff;padding:4px 0">
          <div style="${OSW};font-weight:400;font-size:7px;letter-spacing:.08em;color:#8a7f63">REMUNERAÇÃO</div>
          <div style="${OSW};font-weight:700;font-size:19px;line-height:1.05">+10 🪙</div>
          <div style="${OSW};font-weight:400;font-size:8px;color:#6b6552">por temporada</div>
        </div>
        <div style="position:relative;margin-top:7px;border-top:1px solid #c9bb99;padding-top:4px;
                    font-family:Arial;font-size:8px;color:#62573f;text-align:center">assinatura do empregador
          <span style="position:absolute;right:-2px;top:-14px;transform:rotate(-11deg);border:2px solid #2E6C9E;
                       border-radius:5px;color:#2E6C9E;${OSW};font-weight:700;font-size:8px;padding:1px 5px;opacity:.85">ANOTADO</span>
        </div>
      </div>
    </div>
  </div>`

// um cartão de marca do bico (o "papel" deste passo)
const bicoPapel = (ic, nome, cargo, sel) => `
  <div style="flex:1;border:3px solid ${sel ? ROXO : INK};outline:${sel ? `3px solid ${ROXO}` : 'none'};outline-offset:1px;
              border-radius:6px;background:#f6efdc;box-shadow:3px 3px 0 ${sel ? INK : 'rgba(0,0,0,.55)'};
              padding:7px 4px 6px;text-align:center">
    <div style="font-size:19px;line-height:1">${ic}</div>
    <div style="${OSW};font-weight:700;font-size:10.5px;line-height:1.1;margin-top:3px">${nome}</div>
    <div style="${OSW};font-weight:400;font-size:8.5px;line-height:1.15;color:#6b6552;margin-top:2px">${cargo}</div>
  </div>`

// ── a régua dos 5 passos ────────────────────────────────────────────────────
const PASSOS = [
  { n: 1, ic: '🏆', nome: 'Patrocinador Master', quando: 'só quando o contrato acaba', cor: VERM, novo: false },
  { n: 2, ic: '🤝', nome: 'Patrocinador Pontual', quando: 'TODA temporada', cor: GREEN, novo: false },
  { n: 3, ic: '👟', nome: 'Fornecedor de material', quando: 'só quando o contrato acaba', cor: VERM, novo: false },
  { n: 4, ic: '🛍️', nome: 'Venda de camisas', quando: 'TODA temporada', cor: GREEN, novo: true },
  { n: 5, ic: '🕴️', nome: 'Bico de folga', quando: 'só se subir ou cair de divisão', cor: VERM, novo: true },
]
const chip = (p) => `
  <div style="flex:1;border:3px solid ${INK};border-radius:13px;background:#fff;box-shadow:3px 3px 0 ${INK};
              padding:9px 7px 8px;text-align:center;position:relative">
    ${p.novo ? `<span style="position:absolute;top:-10px;right:-6px;background:${ROXO};color:#fff;border:2.5px solid ${INK};
      border-radius:999px;padding:1px 7px;${OSW};font-weight:700;font-size:8.5px;letter-spacing:.5px">NOVO</span>` : ''}
    <div style="${OSW};font-weight:700;font-size:11px;color:rgba(12,12,12,.4)">PASSO ${p.n}</div>
    <div style="font-size:24px;line-height:1.1;margin:2px 0">${p.ic}</div>
    <div style="${OSW};font-weight:700;font-size:12px;line-height:1.1;text-transform:uppercase">${p.nome}</div>
    <div style="${OSW};font-weight:700;font-size:9px;line-height:1.2;color:${p.cor};margin-top:4px">${p.quando}</div>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:32px 36px 28px;width:1000px}
</style>

<div style="${OSW};font-weight:700;font-size:12px;letter-spacing:2.4px;opacity:.6">MOCKUP · MODO CARREIRA · VIRADA DA TEMPORADA</div>
<h1 style="${OSW};font-weight:700;font-size:38px;line-height:1.02;text-transform:uppercase;margin:4px 0 6px">
  A virada em <span style="color:${ROXO}">5 passos</span>, todos com a mesma cara</h1>
<p style="${OSW};font-weight:400;font-size:14.5px;line-height:1.4;margin:0 0 18px;max-width:920px;opacity:.82">
  Um passo por vez, na ordem que você pediu — e cada um no <b>mesmo molde que o Master já usa hoje</b>:
  cabeçalho escuro → as opções em cima da mesa → a cena → o botão de assinar.
  <b>Só aparece o passo que tem decisão pra tomar</b>; o resto nem desenha.</p>

<div style="display:flex;gap:10px;margin-bottom:8px">${PASSOS.map(chip).join('')}</div>
<div style="display:flex;gap:16px;${OSW};font-weight:400;font-size:12px;opacity:.8;margin-bottom:22px">
  <span><b style="color:${GREEN}">Verde</b> = cai toda temporada (2 decisões fixas).</span>
  <span><b style="color:${VERM}">Vermelho</b> = fica quieto até alguma coisa mudar: contrato que acabou, ou divisão que trocou.</span>
</div>

<!-- ───────── QUANDO CADA UM PAGA (regra dele, 15/09) ───────── -->
<div style="${OSW};font-weight:700;font-size:16px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px">
  💰 E quando cada um cai no caixa</div>
<div style="display:flex;gap:18px;align-items:stretch;margin-bottom:26px">
  ${[
    {
      t: '▶️ Na hora de COMEÇAR a temporada', sub: 'dinheiro garantido — não depende de resultado nenhum',
      cor: GREEN, itens: [['🏆', 'Patrocinador Master', '+26 🪙'], ['👟', 'Fornecedor de material', '+6 🪙'], ['🕴️', 'Bico de folga', '+10 🪙']],
      pe: 'São contratos assinados. Apertou <b>Começar a temporada</b>, o caixa já sobe.',
    },
    {
      t: '🏁 No FIM da temporada', sub: 'são apostas — precisam saber como o ano terminou',
      cor: VERM, itens: [['🤝', 'Patrocinador Pontual', 'bateu a meta ou zero'], ['🛍️', 'Venda de camisas', 'zero só entre os 4 últimos']],
      pe: 'O Pontual é <b>tudo ou nada</b>. A camisa paga em qualquer final — <b>só não paga se cair</b>.',
    },
  ].map(c => `
    <div style="flex:1;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
      <div style="background:${c.cor};color:#fff;padding:9px 13px">
        <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:.4px">${c.t}</div>
        <div style="${OSW};font-weight:400;font-size:11px;opacity:.9;margin-top:1px">${c.sub}</div>
      </div>
      <div style="padding:10px 13px 11px">
        ${c.itens.map(([ic, n, v]) => `
          <div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:2px solid rgba(12,12,12,.08)">
            <span style="font-size:19px;line-height:1;flex:none">${ic}</span>
            <span style="${OSW};font-weight:700;font-size:13.5px;flex:1;text-transform:uppercase">${n}</span>
            <span style="${OSW};font-weight:700;font-size:13.5px;color:${c.cor};white-space:nowrap">${v}</span>
          </div>`).join('')}
        <div style="${OSW};font-weight:400;font-size:11.5px;line-height:1.4;opacity:.8;margin-top:9px">${c.pe}</div>
      </div>
    </div>`).join('')}
</div>
<div style="border:4px solid ${VERM};border-radius:16px;background:#FFF1EE;padding:12px 15px;margin-bottom:26px">
  <div style="${OSW};font-weight:700;font-size:14px;text-transform:uppercase;color:${VERM};margin-bottom:5px">
    ⚠️ Isso MUDA o jogo de hoje — e tem um cuidado</div>
  <div style="${OSW};font-weight:400;font-size:12.5px;line-height:1.5">
    Hoje os <b>cinco</b> pagam no fim da temporada (todos dentro do mesmo fechamento de caixa).
    Passar três deles pro começo é seguro, menos num caso: quem estiver <b>no meio de uma temporada</b>
    no dia do deploy já começou o ano sem receber — e o fim deixaria de pagar. Sumiria uma parcela dele.
    <b>Solução:</b> marcar no save qual temporada já foi paga; o começo paga se ainda não pagou, e o
    fechamento continua pagando só o que ficou pra trás. Ninguém recebe duas vezes e ninguém perde nada.</div>
</div>

<!-- ───────── o molde que já existe ───────── -->
<div style="${OSW};font-weight:700;font-size:16px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px">
  📐 O molde — é o que o Master já faz hoje</div>
<div style="display:flex;gap:22px;align-items:flex-start;margin-bottom:26px">
  <div style="flex:none;width:400px">
    ${molde({
      passo: 1, total: 5, chapeu: 'SÉRIE C · CONTRATO ACABOU', titulo: 'Patrocinador Master',
      lead: 'Quatro contratos na mesa — cada um com o seu prazo. Escolha um.',
      opcoes: '', cena: cenaEscritorio,
      explica: '<b>130 moedas em 5 temporadas = +26 por temporada</b>, garantidas. O valor trava na Série C, onde você assina.',
      botao: '✍️ Assinar · Vadico · 5 temporadas',
      rodape: 'Só volta quando um contrato termina.',
    })}
  </div>
  <div style="flex:1;padding-top:6px">
    <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.55;opacity:.85">
      Essa tela tem <b>quatro andares</b>, e é neles que as duas telas novas vão entrar:
    </div>
    ${[
      ['1', 'CABEÇALHO ESCURO', 'onde agora entra a pílula dourada <b>PASSO X DE 5</b> — é ela que dá a sensação de fila, sem mudar nada do resto.'],
      ['2', 'AS OPÇÕES', 'os papéis em cima da mesa. No Master são os 4 contratos; na camisa viram os 3 preços; no bico, as 4 empresas.'],
      ['3', 'A CENA', 'a foto grande. Hoje é o escritório. Na camisa vira <b>a vitrine com a camisa grande</b>; no bico, <b>a carteira de trabalho</b>.'],
      ['4', 'A BARRA DE BAIXO', 'a explicação em uma frase e o botão de assinar. Igual em todas.'],
    ].map(([n, t, d]) => `
      <div style="display:flex;gap:10px;align-items:flex-start;margin-top:12px">
        <span style="flex:none;width:26px;height:26px;border:3px solid ${INK};border-radius:8px;background:${INK};color:${GOLD};
          display:flex;align-items:center;justify-content:center;${OSW};font-weight:700;font-size:14px">${n}</span>
        <div style="flex:1">
          <div style="${OSW};font-weight:700;font-size:12.5px;letter-spacing:.4px">${t}</div>
          <div style="${OSW};font-weight:400;font-size:12px;line-height:1.4;opacity:.78;margin-top:1px">${d}</div>
        </div>
      </div>`).join('')}
  </div>
</div>

<!-- ───────── as duas telas novas ───────── -->
<div style="${OSW};font-weight:700;font-size:16px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:10px">
  ✨ As duas telas novas, no mesmo molde</div>
<div style="display:flex;gap:26px;align-items:flex-start">
  <div style="flex:1">
    ${molde({
      passo: 4, total: 5, chapeu: 'SÉRIE C · TEMPORADA 7', titulo: 'Venda de camisas',
      lead: 'A sua camisa na vitrine. Escolha o preço desta temporada.',
      opcoes: `<div style="display:flex;gap:9px">
        ${precoPapel('Popular', 1, 'se só se manter', false)}
        ${precoPapel('Normal', 2, 'se pegar o acesso', false)}
        ${precoPapel('Cara', 3, 'se for campeão', true)}
      </div>`,
      cena: cenaVitrine,
      explica: 'Camisa <b>cara</b>: pouca gente leva, mas cada uma vale ouro — <b>rende o dobro num ano de campeão</b>. A sua torcida cresce com as arquibancadas que você levanta.',
      botao: '✍️ Confirmar o preço · Cara',
      rodape: 'O balanço chega na abertura da temporada seguinte.',
    })}
  </div>
  <div style="flex:1">
    ${molde({
      passo: 5, total: 5, chapeu: 'SÉRIE C · TEMPORADA 7', titulo: 'Bico de folga',
      lead: 'Nas folgas você trabalha pra ajudar o caixa. Escolha onde.',
      opcoes: `<div style="display:flex;gap:7px">
        ${bicoPapel('🚗', 'Vadico Veículos', 'gerente da loja', true)}
        ${bicoPapel('💍', 'Max Jóias', 'chefe do balcão', false)}
        ${bicoPapel('🦷', 'ERO Odontologia', 'gerente da clínica', false)}
        ${bicoPapel('🎨', 'Rei das Tintas', 'chefe da equipe', false)}
      </div>`,
      cena: cenaCarteira,
      explica: 'Começou lavando carro no pátio pra fechar o mês. Hoje é gerente — <b>cada degrau do clube foi um degrau ali também</b>.',
      botao: '✍️ Assinar a carteira',
      rodape: 'Na Série B pra cima ele larga o bico. Se cair de novo, volta — e ganhando os mesmos 10.',
    })}
  </div>
</div>

<!-- ───────── o que muda na prática ───────── -->
<div style="margin-top:24px;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
  <div style="background:${INK};color:${GOLD};${OSW};font-weight:700;font-size:14.5px;letter-spacing:1.2px;
              padding:10px 14px;text-transform:uppercase">🔧 o que muda de verdade no código</div>
  <div style="padding:12px 14px;${OSW};font-weight:400;font-size:13px;line-height:1.55">
    <div style="margin-bottom:7px">· <b>A ordem troca:</b> hoje o Fornecedor vem antes do Pontual. Passa a ser
      Master → <b>Pontual</b> → Fornecedor → Camisas → Bico, como você pediu.</div>
    <div style="margin-bottom:7px">· <b>Master, fornecedor e bico passam a pagar no COMEÇO</b> (hoje os cinco pagam
      no fim). Com a marca de "já paguei esta temporada" no save, pra ninguém receber duas vezes
      nem perder a parcela na virada do deploy.</div>
    <div style="margin-bottom:7px">· <b>A pílula PASSO X DE 5</b> entra no cabeçalho dos cinco, e o número é contado
      só entre os passos que estão aparecendo — se só tem 2 decisões, ele diz "passo 1 de 2".</div>
    <div style="margin-bottom:7px">· <b>Camisa e bico ganham o molde do Master</b> (hoje são duas caixinhas brancas
      pequenas, fora do padrão).</div>
    <div style="margin-bottom:7px">· <b>O bico volta a aparecer quando a divisão muda</b> — sobe ou cai, o cargo muda
      de degrau e ele te pergunta de novo. Isso conserta um buraco que estava aberto:
      depois de escolher, hoje não havia mais onde trocar.</div>
    <div>· <b>Nenhum valor muda</b>: régua do Master, do Pontual, do fornecedor, dos preços e do bico ficam
      exatamente como estão. É só a casca.</div>
  </div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
