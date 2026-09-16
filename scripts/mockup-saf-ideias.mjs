// 🏢 AS IDEIAS DA SAF E A QUANTIDADE DO ELENCO — desenhadas na tela (Diego 16/09)
//
// Pedido dele, depois do levantamento: *"quero todas ideias pra saf e pro elenco
// quantidade visual"*. Então aqui cada ideia vira TELA, não texto.
//
// ⚠️ NADA DISTO ESTÁ NO JOGO. É desenho pra ele aprovar (ou vetar) antes de codar.
// Os números são os que já foram medidos/conferidos no código:
//   · vagas por posição = FORMATIONS[f][pos] × 2 (store.tsx, `slotsCheio`)
//   · empréstimo da SAF, POR LADO: Série D 1 · C 2 · B 3 · A 4 (estadio.tsx)
//   · quem vem emprestado entra POR CIMA do teto → Série A já é 26 hoje
//   · o piso do jogador já sobe no jogo (+10 pro artilheiro) — é a mecânica que a
//     Ideia 1 reaproveita, por isso ela não inventa sistema novo
//
// Rodar: node scripts/mockup-saf-ideias.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { FONTES, OSW, INK, CREME, GOLD, GREEN } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-saf-ideias.png')
const VERM = '#C2452F', ROXO = '#7C3AED', AZUL = '#1F5FA8', SLATE = '#3E4A5A', BEGE = '#B2A583'

// ─── a "camisinha" de uma vaga do elenco ────────────────────────────────────
const camisa = (cor, borda = INK, tracejado = false) => `
  <span style="display:inline-block;width:19px;height:21px;margin:2px;background:${cor};
    border:${tracejado ? `2px dashed ${borda}` : `2px solid ${borda}`};border-radius:4px 4px 6px 6px;
    position:relative;vertical-align:top">
    <span style="position:absolute;top:-2px;left:3px;right:3px;height:5px;background:${cor};
      border:${tracejado ? `2px dashed ${borda}` : `2px solid ${borda}`};border-bottom:0;border-radius:3px 3px 0 0"></span></span>`

// uma linha da grade: posição · camisas de hoje · a nova (se houver) · as da SAF
const linhaVaga = (pos, hoje, extra, saf) => `
  <div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:2px solid rgba(12,12,12,.07)">
    <span style="${OSW};font-weight:700;font-size:13px;width:42px;flex:none">${pos}</span>
    <span style="flex:1;line-height:0">
      ${Array.from({ length: hoje }, () => camisa(BEGE)).join('')}
      ${Array.from({ length: extra }, () => camisa('#D9C7F5', ROXO)).join('')}
      ${saf ? `<span style="display:inline-block;width:10px"></span>${Array.from({ length: saf }, () => camisa('#C9D2DC', SLATE, true)).join('')}` : ''}
    </span>
    <span style="${OSW};font-weight:700;font-size:14px;width:40px;text-align:right;flex:none">${hoje + extra}${saf ? `<span style="color:${SLATE};font-size:11px">+${saf}</span>` : ''}</span>
  </div>`

const grade = (titulo, sub, cor, linhas, total, nota) => `
  <div style="flex:1;border:4px solid ${cor};border-radius:16px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
    <div style="background:${cor};color:#fff;padding:9px 13px">
      <div style="${OSW};font-weight:700;font-size:15px;text-transform:uppercase;line-height:1.1">${titulo}</div>
      <div style="${OSW};font-weight:400;font-size:11.5px;opacity:.85">${sub}</div>
    </div>
    <div style="padding:8px 13px 10px">${linhas}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px">
        <span style="${OSW};font-weight:700;font-size:12px;opacity:.6;text-transform:uppercase">no elenco</span>
        <span style="${OSW};font-weight:700;font-size:24px">${total}</span></div>
      <div style="${OSW};font-weight:400;font-size:11.5px;line-height:1.45;margin-top:5px;opacity:.8">${nota}</div>
    </div>
  </div>`

// ─── uma "telinha" do jogo (celular estreito, com a cara do jogo) ────────────
const tela = (conteudo, largura = 330) => `
  <div style="width:${largura}px;flex:none;background:${CREME};border:5px solid ${INK};border-radius:20px;
    box-shadow:6px 6px 0 ${INK};padding:11px;overflow:hidden">${conteudo}</div>`

const caixa = (bg, conteudo, borda = INK) => `
  <div style="background:${bg};border:3px solid ${borda};border-radius:13px;box-shadow:3px 3px 0 ${INK};
    padding:10px 11px;margin-bottom:9px">${conteudo}</div>`

const tituloIdeia = (n, emoji, titulo, tag, cor, resumo) => `
  <div style="display:flex;align-items:center;gap:11px;margin-bottom:9px">
    <span style="font-size:30px;line-height:1">${emoji}</span>
    <div style="flex:1">
      <div style="${OSW};font-weight:700;font-size:22px;text-transform:uppercase;line-height:1.05">${n} · ${titulo}</div>
      <div style="${OSW};font-weight:400;font-size:13.5px;line-height:1.45;opacity:.82;margin-top:2px">${resumo}</div>
    </div>
    <span style="background:${cor};color:#fff;border:3px solid ${INK};border-radius:999px;padding:4px 13px;
      ${OSW};font-weight:700;font-size:11px;letter-spacing:1.2px;box-shadow:3px 3px 0 ${INK};flex:none">${tag}</span>
  </div>`

const bloco = (n, emoji, titulo, tag, cor, resumo, telas, comoFunciona) => `
  <div style="border:4px solid ${INK};border-radius:20px;background:#fff;box-shadow:6px 6px 0 ${INK};
    padding:15px 18px;margin-bottom:20px">
    ${tituloIdeia(n, emoji, titulo, tag, cor, resumo)}
    <div style="display:flex;gap:18px;align-items:flex-start;margin-top:12px">
      <div style="display:flex;gap:14px;flex:none">${telas}</div>
      <div style="flex:1;${OSW};font-weight:400;font-size:13.5px;line-height:1.6">${comoFunciona}</div>
    </div>
  </div>`

const barrinha = pct => `
  <span style="display:block;height:11px;background:#E3DAC0;border:2px solid ${INK};border-radius:6px;overflow:hidden">
    <span style="display:block;height:100%;width:${pct}%;background:${GREEN}"></span></span>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:34px 38px 30px;width:1420px}
</style>

<div style="${OSW};font-weight:700;font-size:11.5px;letter-spacing:2.4px;opacity:.6">
  TUDO AQUI É DESENHO · NADA ESTÁ NO JOGO · É PRA VOCÊ APROVAR OU VETAR ANTES DE EU CODAR</div>
<h1 style="${OSW};font-weight:700;font-size:44px;line-height:1.02;text-transform:uppercase;margin:5px 0 7px">
  Todas as ideias <span style="color:${ROXO}">na tela</span></h1>
<p style="${OSW};font-weight:400;font-size:15px;line-height:1.45;margin:0 0 24px;max-width:1120px;opacity:.85">
  Primeiro a <b>quantidade do elenco</b>, camisa por camisa, pra você bater o olho. Depois as <b>quatro ideias
  da SAF</b>, cada uma desenhada como ficaria no jogo.</p>

<!-- ───────────── 1 · QUANTIDADE DO ELENCO ───────────── -->
<div style="${OSW};font-weight:700;font-size:24px;text-transform:uppercase;margin:0 0 4px">1 · A quantidade do elenco</div>
<p style="${OSW};font-weight:400;font-size:14px;line-height:1.5;margin:0 0 14px;opacity:.85">
  Cada camisinha é uma <b>vaga</b>. Bege = o elenco que você monta no leilão ·
  <span style="color:${ROXO}"><b>roxo</b></span> = a vaga nova ·
  <span style="color:${SLATE}"><b>cinza tracejado</b></span> = emprestado da SAF (entra <b>por cima</b> do teto).
  Exemplo no <b>4-4-2</b>, <b>Série A</b> (4 empréstimos).</p>

<div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:14px">
  ${grade('Hoje', 'a régua é 2× a formação', INK,
    linhaVaga('GOL', 2, 0, 0) + linhaVaga('LAT', 4, 0, 1) + linhaVaga('ZAG', 4, 0, 1) + linhaVaga('MEI', 8, 0, 1) + linhaVaga('ATA', 4, 0, 1),
    22, 'Com a SAF na Série A o teto real <b>já é 26</b> — isso não é novo.')}
  ${grade('Caminho B · +1 goleiro', 'o aperto que existe sempre', GREEN,
    linhaVaga('GOL', 2, 1, 0) + linhaVaga('LAT', 4, 0, 1) + linhaVaga('ZAG', 4, 0, 1) + linhaVaga('MEI', 8, 0, 1) + linhaVaga('ATA', 4, 0, 1),
    23, 'Uma linha a mais na lista: <b>+55px</b>. O gol deixa de ficar sem ninguém real.')}
  ${grade('Caminho A · +1 em tudo', 'o que você pensou', ROXO,
    linhaVaga('GOL', 2, 1, 0) + linhaVaga('LAT', 4, 1, 1) + linhaVaga('ZAG', 4, 1, 1) + linhaVaga('MEI', 8, 1, 1) + linhaVaga('ATA', 4, 1, 1),
    27, '<b>+275px</b> (1/3 de tela). Mas o <b>MEI vira 9</b> — e 8 já sobrava.')}
</div>
<div style="border:4px solid ${VERM};border-radius:16px;background:#FDF1EE;padding:12px 16px;margin-bottom:30px;
  ${OSW};font-weight:400;font-size:13.5px;line-height:1.55">
  <b style="color:${VERM}">Olhe a linha do GOL nas três.</b> São <b>2</b> — e é 2 em <b>todas as 7 formações</b> do jogo.
  Titular machucado + reserva suspenso e não existe terceiro: <b>não dá pra botar zagueiro no gol</b>. Já o MEI tem 8
  e quase nunca acaba. É por isso que eu somaria no gol antes de somar em todas.</div>

<!-- ───────────── 2 · AS IDEIAS DA SAF ───────────── -->
<div style="${OSW};font-weight:700;font-size:24px;text-transform:uppercase;margin:0 0 14px">2 · As quatro ideias da SAF</div>

${bloco('IDEIA 1', '🌱', 'A SAF forma jogador', 'A QUE EU FARIA', GREEN,
  'Hoje todo mundo só PEGA da SAF. Isso faz o caminho de volta existir.',
  tela(`
    <div style="${OSW};font-weight:700;font-size:12px;letter-spacing:1px;opacity:.55;margin-bottom:7px">💼 SUA SAF · SÉRIE D</div>
    ${caixa('#F1F7F2', `
      <div style="${OSW};font-weight:700;font-size:12.5px;margin-bottom:6px">🌱 EMPRESTADOS PRA SAF</div>
      <div style="${OSW};font-weight:700;font-size:14px">Kerlon <span style="font-size:10.5px;opacity:.6">MEI · 20 anos</span></div>
      <div style="${OSW};font-weight:400;font-size:11px;opacity:.7;margin:3px 0 6px">jogando a Série D pela sua SAF</div>
      ${barrinha(63)}
      <div style="display:flex;justify-content:space-between;${OSW};font-weight:700;font-size:10.5px;margin-top:4px">
        <span style="opacity:.6">24 de 38 jogos</span><span style="color:${GREEN}">piso 66 → 71</span></div>`, GREEN)}
    ${caixa('#fff', `
      <div style="${OSW};font-weight:700;font-size:14px">Vagalume <span style="font-size:10.5px;opacity:.6">ATA · 19 anos</span></div>
      <div style="${OSW};font-weight:400;font-size:11px;opacity:.7;margin:3px 0 6px">no banco da SAF — joga pouco</div>
      ${barrinha(18)}
      <div style="display:flex;justify-content:space-between;${OSW};font-weight:700;font-size:10.5px;margin-top:4px">
        <span style="opacity:.6">7 de 38 jogos</span><span style="opacity:.6">piso 61 → 62</span></div>`)}
  `) + tela(`
    <div style="${OSW};font-weight:700;font-size:12px;letter-spacing:1px;opacity:.55;margin-bottom:7px">🗓️ NA VIRADA DA TEMPORADA</div>
    <div style="background:linear-gradient(160deg,#1B7A3D,#0f4a24);border:4px solid ${INK};border-radius:15px;
      box-shadow:4px 4px 0 ${INK};padding:15px 13px;text-align:center;color:#fff">
      <div style="font-size:40px;line-height:1">🌱</div>
      <div style="${OSW};font-weight:700;font-size:17px;color:${GOLD};margin:7px 0 4px;text-transform:uppercase">Kerlon voltou da SAF</div>
      <div style="${OSW};font-weight:400;font-size:12px;line-height:1.5;opacity:.92">
        Jogou <b>38 jogos</b> na Série D e virou titular lá. Voltou <b>mais rodado</b>.</div>
      <div style="background:${GOLD};color:${INK};border:3px solid ${INK};border-radius:11px;padding:8px;margin-top:11px;
        ${OSW};font-weight:700;font-size:16px">piso 66 → <span style="font-size:22px">71</span></div>
      <div style="${OSW};font-weight:400;font-size:10.5px;opacity:.7;margin-top:7px">quem fica no banco da SAF volta quase igual — tem que JOGAR</div>
    </div>
  `),
  `<b>Como funciona:</b> você empresta um jogador SEU pra SAF. Ela joga a Série D dela toda semana, e ele
   <b>joga de verdade lá</b>. No fim da temporada ele volta com o <b>piso maior</b> — quanto mais jogos, mais sobe.
   Quem fica no banco lá volta quase igual.<br><br>
   <b>Por que eu escolheria esta:</b> resolve o seu medo pela raiz. Hoje o valor da SAF é "ela me empresta gente" —
   então elenco maior mata a SAF. Com isso, o valor vira <b>"ela faz meu jogador crescer"</b>, e aí
   <b>não importa</b> o tamanho do seu elenco.<br><br>
   <b>E não inventa sistema novo:</b> o jogo <b>já sobe o piso</b> de jogador (o artilheiro ganha +10 de piso).
   É a mesma engrenagem, usada noutro lugar.<br><br>
   <span style="color:${VERM}"><b>O cuidado:</b></span> mexe em ficha de jogador dentro do save. Só no SEU save
   (não toca no catálogo), e com teto pra não virar fábrica de craque.`)}

${bloco('IDEIA 2', '🎽', 'A SAF é o teto do elenco', 'CUSTO ZERO', AZUL,
  'Em vez de subir o elenco no braço, passar de 22 vira mérito: só com SAF e subindo de divisão.',
  tela(`
    <div style="${OSW};font-weight:700;font-size:12px;letter-spacing:1px;opacity:.55;margin-bottom:7px">👥 ELENCO</div>
    ${caixa('#fff', `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="${OSW};font-weight:700;font-size:15px">SEU ELENCO</span>
        <span style="${OSW};font-weight:700;font-size:15px">22<span style="opacity:.45">/22</span></span></div>
      <div style="line-height:0;margin-bottom:10px">${Array.from({ length: 22 }, () => camisa(BEGE)).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="${OSW};font-weight:700;font-size:13px;color:${SLATE}">🏢 DA SUA SAF · SÉRIE B</span>
        <span style="${OSW};font-weight:700;font-size:13px;color:${SLATE}">2<span style="opacity:.45">/3</span></span></div>
      <div style="line-height:0">${camisa('#C9D2DC', SLATE, true)}${camisa('#C9D2DC', SLATE, true)}${camisa('#EFEFEF', '#BBB', true)}</div>
      <div style="${OSW};font-weight:400;font-size:10.5px;line-height:1.45;margin-top:9px;opacity:.72">
        Você joga com <b>24</b>. Subindo pra <b>Série A</b> abre a <b>4ª</b> vaga.</div>`, SLATE)}
  `) + tela(`
    <div style="${OSW};font-weight:700;font-size:12px;letter-spacing:1px;opacity:.55;margin-bottom:7px">🪜 A ESCADA</div>
    ${['Várzea', 'Série D', 'Série C', 'Série B', 'Série A'].map((d, i) => {
      const n = [0, 1, 2, 3, 4][i]
      return `<div style="display:flex;align-items:center;gap:9px;padding:6px 0;border-bottom:2px solid rgba(12,12,12,.07)">
        <span style="${OSW};font-weight:700;font-size:12.5px;width:60px;flex:none">${d}</span>
        <span style="flex:1;line-height:0">${n ? Array.from({ length: n }, () => camisa('#C9D2DC', SLATE, true)).join('') : `<span style="${OSW};font-weight:400;font-size:10.5px;opacity:.5">sem SAF ainda</span>`}</span>
        <span style="${OSW};font-weight:700;font-size:15px;flex:none">${22 + n}</span></div>`
    }).join('')}
    <div style="${OSW};font-weight:400;font-size:10.5px;line-height:1.45;margin-top:9px;opacity:.72">
      O elenco cresce <b>por mérito</b>: a escada já existe no jogo, ninguém precisa codar nada.</div>
  `),
  `<b>Como funciona:</b> o elenco continua 22 (a régua limpa que o leilão, o Monte e a base todos usam), e o jeito
   de ter mais gente é <b>a SAF</b> — 1 na Série D, 2 na C, 3 na B, 4 na A, que é <b>exatamente a escada que já
   existe</b> hoje.<br><br>
   <b>O que muda de verdade:</b> quase nada no código — muda a <b>leitura</b>. Hoje o emprestado se mistura na
   lista com um chip "EMP" cinza; aqui ele ganha um <b>bloco próprio</b>, com o número de vagas à vista.
   Você bate o olho e sabe quantos são seus e quantos são da SAF.<br><br>
   <b>A favor:</b> elenco maior vira prêmio de subir de divisão, e a SAF fica sendo o caminho.<br>
   <span style="color:${VERM}"><b>Contra:</b></span> quem não comprou a SAF (2.000 🪙 é caro cedo) continua com
   o gol apertado. Por isso ela combina bem com o <b>+1 goleiro</b>.`)}

${bloco('IDEIA 3', '💰', 'Emprestar vira dinheiro', 'BARATA', ROXO,
  'Hoje o empréstimo é de graça nos dois lados. Com luva, vira decisão de caixa.',
  tela(`
    <div style="${OSW};font-weight:700;font-size:12px;letter-spacing:1px;opacity:.55;margin-bottom:7px">🔄 JANELA DE EMPRÉSTIMO</div>
    ${caixa('#fff', `
      <div style="${OSW};font-weight:700;font-size:13.5px">📤 Emprestar pra SAF</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:7px 9px;background:#F6F0FF;
        border:2.5px solid ${ROXO};border-radius:10px">
        <span style="flex:1;${OSW};font-weight:700;font-size:12.5px">Vagalume <span style="opacity:.55;font-size:10px">ATA</span></span>
        <span style="background:${ROXO};color:#fff;${OSW};font-weight:700;font-size:12px;border-radius:7px;padding:3px 9px">+8 🪙<span style="font-size:9px;opacity:.85">/temp.</span></span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding:7px 9px;background:#F6F0FF;
        border:2.5px solid ${ROXO};border-radius:10px">
        <span style="flex:1;${OSW};font-weight:700;font-size:12.5px">Kerlon <span style="opacity:.55;font-size:10px">MEI</span></span>
        <span style="background:${ROXO};color:#fff;${OSW};font-weight:700;font-size:12px;border-radius:7px;padding:3px 9px">+12 🪙<span style="font-size:9px;opacity:.85">/temp.</span></span>
      </div>
      <div style="${OSW};font-weight:400;font-size:10.5px;line-height:1.45;margin-top:9px;opacity:.72">
        A SAF paga pra usar o seu jogador. Quanto melhor ele é, mais ela paga.</div>`, ROXO)}
  `),
  `<b>Como funciona:</b> a SAF paga uma <b>luva por temporada</b> por cada jogador seu que ela usa — mais alta
   pro jogador melhor. O dinheiro cai no seu caixa na virada, junto com o resto.<br><br>
   <b>Pra que serve:</b> é uma <b>saída honesta pra quem está duro</b>. Hoje, clube quebrado só tem um caminho:
   vender jogador de vez. Com isso ele pode emprestar por uma temporada, levantar moeda e ter o jogador de
   volta — sem perder ninguém.<br><br>
   <b>Casa com o conserto de hoje de manhã:</b> lembra da crise do caixa no vermelho (−500) que faz o melhor
   jogador ameaçar sair? Isto dá uma <b>terceira saída</b> pra ela, que não é perder ninguém.<br><br>
   <span style="color:${VERM}"><b>O cuidado:</b></span> tem que ser pouco dinheiro, senão vira torneira e
   desequilibra o caixa da carreira — eu mediria a régua antes.`)}

${bloco('IDEIA 4', '📰', 'A SAF aparece no jornal', 'BARATA', SLATE,
  'Ela joga a temporada inteira e você só vê um número no fim. Isso dá vida a ela.',
  tela(`
    <div style="background:#F4ECD6;border:4px solid ${INK};border-radius:13px;box-shadow:4px 4px 0 ${INK};padding:12px 11px">
      <div style="text-align:center;border-bottom:3px solid ${INK};padding-bottom:6px;margin-bottom:9px">
        <div style="${OSW};font-weight:700;font-size:20px;letter-spacing:-.5px">O MARTELO</div>
        <div style="${OSW};font-weight:400;font-size:9px;letter-spacing:2px;opacity:.6">PÁGINA 2 · A SUA SAF</div></div>
      ${[['🎉', 'Sua SAF subiu pra Série C', 'O time que você comprou terminou em 2º e vai jogar a Série C. Sua fatia de campanha cresce junto.'],
         ['🥇', 'Kerlon foi artilheiro da Série D', '21 gols emprestado na sua SAF. Volta pra você mais rodado — e mais caro.'],
         ['😬', 'A SAF quase se enrolou no fim', 'Terminou em 9º depois de flertar com a queda. Você teria pago metade da multa.']].map(([ic, t, s]) => `
        <div style="display:flex;gap:9px;padding:7px 0;border-bottom:2px solid rgba(12,12,12,.1)">
          <span style="font-size:19px;line-height:1.1;flex:none">${ic}</span>
          <div><div style="${OSW};font-weight:700;font-size:12.5px;line-height:1.15">${t}</div>
          <div style="${OSW};font-weight:400;font-size:10.5px;line-height:1.4;opacity:.75;margin-top:2px">${s}</div></div>
        </div>`).join('')}
    </div>
  `),
  `<b>Como funciona:</b> a página 2 do jornal <b>já existe</b> (é onde saem as notícias dos seus agenciados).
   A SAF passa a aparecer nela: subiu, caiu, escapou no sufoco, e o que o SEU jogador emprestado fez lá.<br><br>
   <b>Pra que serve:</b> hoje a SAF é uma linha de número na virada. Ela custa <b>2.000 🪙</b> e você não vê
   nada acontecer — parece planilha, não clube. Três linhas por temporada já fazem ela existir.<br><br>
   <b>É a mais barata de todas</b> e não muda regra nenhuma: só conta o que já aconteceu.<br><br>
   <span style="color:${VERM}"><b>Sua regra respeitada:</b></span> nada aqui aparece antes do apito — é tudo
   notícia do que já passou, igual ao resto do jornal.`)}

<div style="border:4px solid ${GOLD};border-radius:20px;background:#FFFBEE;padding:16px 20px">
  <div style="${OSW};font-weight:700;font-size:19px;text-transform:uppercase;margin-bottom:8px">
    🎯 Se você quiser TODAS, esta é a ordem que eu faria</div>
  <div style="${OSW};font-weight:400;font-size:14px;line-height:1.7">
    <b>1º · Ideia 4 (jornal)</b> — é a mais barata, não muda regra nenhuma e já faz a SAF parecer viva. Dá pra sair hoje.<br>
    <b>2º · +1 goleiro</b> — uma linha na lista, resolve o buraco que existe em toda formação.<br>
    <b>3º · Ideia 2 (bloco da SAF no elenco)</b> — quase só leitura de tela; deixa claro quantos são seus e quantos são dela.<br>
    <b>4º · Ideia 1 (a SAF forma jogador)</b> — a que muda o jogo de verdade, e por isso a que eu quero fazer com
    calma e com teto, pra não virar fábrica de craque.<br>
    <b>5º · Ideia 3 (luva)</b> — por último porque mexe em dinheiro, e dinheiro eu prefiro medir antes de soltar.<br><br>
    <b>E o +1 em TODAS as posições (caminho A)?</b> Dá pra fazer junto, é só você mandar — mas aí eu meço primeiro
    quanto muda o <b>tamanho da mesa do leilão</b> e a <b>folha salarial</b>, porque o efeito sai da tela e vai pro bolso.</div>
</div>

<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;border-top:5px solid ${INK};padding-top:13px">
  <div style="${OSW};font-weight:700;font-size:26px;text-transform:uppercase">⚽ Leilão <span style="color:${VERM}">Legends</span></div>
  <div style="${OSW};font-weight:400;font-size:12.5px;color:#6b6552;text-align:right;line-height:1.35">
    desenho de 16/09 · NADA está no jogo<br>refazer: <b>node scripts/mockup-saf-ideias.mjs</b></div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1420, height: 700 }, deviceScaleFactor: 1.5 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
