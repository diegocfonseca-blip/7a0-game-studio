// 🏐 MOCKUP — FUTEVÔLEI DEPRESSÃO no Leilão Legends (proposta pro patrocinador)
//
// Nasceu em 21/08. O Diego trouxe a página @futevoleidepressao (266 mil
// seguidores, o Pedrinho) como patrocinador e pediu pra VER, num board só,
// tudo que a marca pode ocupar dentro do jogo:
//   1. 🏐 Torneio de praia dos ÚLTIMOS 4 DA VÁRZEA (2 semis + final, set até 18)
//   2. 🏖️ A quadra de areia com a marca (e o "bico" busca-bola)
//   3. 🕴️ Bico de Folga — a marca vira o 5º bico, igual o Rei das Tintas
//   4. 🤝 Patrocinador do clube — a marca na lista da aposta de patrocínio
//   5. 😂 A zoeira dos folclóricos (Renato Gaúcho, Romário, Edmundo)
//
// ⚠️ FATO CONFERIDO NO CÓDIGO (21/08), porque o Diego achava o contrário:
// na COPA DO BRASIL **todo mundo joga, a Várzea inteira inclusive** — o
// comentário do `copa-brasil.ts` é explícito ("Várzea joga a Copa do Brasil
// inteira, ao contrário da Copa Legends, que a exclui") e a peneira leva TODOS
// os 72 que não entram direto. Então o critério do torneio de praia NÃO é
// "quem não jogou a copa": é **os 4 últimos da Várzea**, que é o fundo do
// mundo — não sobem, não caem (não existe divisão abaixo) e já caíram fora da
// copa no primeiro jogo. São os únicos com literalmente nada em jogo.
//
// Mora no repo (e não no scratchpad) pela mesma razão dos outros mockups:
// feito à mão SE PERDE. Se o Diego pedir ajuste, é aqui que se mexe.
//
// ⚠️ O LOGO é o REAL da página, recortado do print que o Diego mandou. Não
// inventar arte da marca deles — pra valer, pedir o arquivo original.
//
//   node scripts/mockup-futevolei.mjs --logo caminho/fd_logo.png --saida x.png
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const b64f = f => readFileSync(`scripts/fonts/oswald-latin-${f}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64f(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'futevolei.png')
const LOGO = arg('--logo', null)
const logoSrc = LOGO ? `data:image/png;base64,${readFileSync(LOGO).toString('base64')}` : null

// identidade da casa
const CREME = '#F4ECD6', INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F'
// identidade DELES (medida no logo real, não chutada)
const MARINHO = '#0C2C66'
const AREIA = '#E4C79B', AREIA2 = '#D3B27F'

const OSW = 'font-family:Oswald,sans-serif'
const box = (bg = '#fff', r = 18) => `background:${bg};border:4px solid ${INK};border-radius:${r}px;box-shadow:5px 5px 0 ${INK}`
const marca = (tam = 54) => logoSrc
  ? `<img src="${logoSrc}" style="width:${tam}px;height:${tam}px;border-radius:50%;border:3px solid ${INK};flex-shrink:0" />`
  : `<span style="width:${tam}px;height:${tam}px;border-radius:50%;border:3px solid ${INK};background:${MARINHO};color:#fff;display:flex;align-items:center;justify-content:center;${OSW};font-weight:700;font-size:${tam * .3}px;flex-shrink:0">FD</span>`

// mini-carta verde (a mesma do jogo, reduzida)
const mini = (nome, pos, clube, w = 118) => `
  <div style="width:${w}px;border:3px solid ${INK};border-radius:12px;background:linear-gradient(150deg,#41C07A,#2E9E5B 55%,#1E7A45);
              box-shadow:4px 4px 0 ${INK};aspect-ratio:3/4.2;padding:8px;display:flex;flex-direction:column;justify-content:space-between">
    <span style="${OSW};font-weight:700;background:${INK};color:#fff;border-radius:6px;font-size:9px;padding:1px 6px;align-self:flex-start">${pos}</span>
    <span style="align-self:center;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.35);color:#14532d;border:2px solid rgba(0,0,0,.28);
                 display:flex;align-items:center;justify-content:center;${OSW};font-weight:700;font-size:18px">${nome[0]}</span>
    <span style="text-align:center">
      <b style="display:block;${OSW};font-weight:700;color:#fff;font-size:12px;line-height:1.1">${nome}</b>
      <b style="display:block;color:#fff;opacity:.7;font-size:8px;font-weight:800;margin-top:2px">${clube}</b></span>
  </div>`

const titulo = (n, emoji, texto, sub) => `
  <div style="margin:0 0 14px">
    <p style="${OSW};font-weight:700;font-size:34px;margin:0;text-transform:uppercase;line-height:1.18">
      <span style="color:${RED}">${n}.</span> ${emoji} ${texto}</p>
    <p style="font-size:19px;font-weight:600;margin:4px 0 0;line-height:1.35;opacity:.78">${sub}</p>
  </div>`

// linha de confronto do chaveamento
const duelo = (posA, a, gA, posB, b, gB, venceA) => `
  <div style="${box('#fff', 14)};padding:10px 12px;margin-bottom:10px">
    ${[[posA, a, gA, venceA], [posB, b, gB, !venceA]].map(([p, n, g, win]) => `
      <div style="display:flex;align-items:center;gap:9px;padding:5px 0;${win ? '' : 'opacity:.5'}">
        <span style="${OSW};font-weight:700;font-size:12px;background:${INK};color:#fff;border-radius:6px;padding:1px 7px;flex-shrink:0">${p}</span>
        <b style="${OSW};font-weight:700;font-size:16px;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n}</b>
        <b style="${OSW};font-weight:700;font-size:22px;color:${win ? MARINHO : INK}">${g}</b>
      </div>`).join('')}
  </div>`

const bicoLinha = (ic, bg, nome, cargo, novo) => `
  <div style="display:flex;align-items:center;gap:12px;border:3px solid ${novo ? MARINHO : INK};border-radius:12px;padding:9px 12px;background:${novo ? '#EAF0FB' : '#FBF6E9'}">
    ${ic ? `<span style="width:42px;height:42px;border-radius:10px;border:3px solid ${INK};background:${bg};display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0">${ic}</span>` : marca(42)}
    <span style="flex:1;min-width:0"><b style="display:block;${OSW};font-weight:700;font-size:17px">${nome}</b>
    <b style="display:block;font-size:13.5px;font-weight:700;opacity:.6">${cargo}</b></span>
    ${novo ? `<span style="${OSW};font-weight:700;font-size:12px;background:${MARINHO};color:#fff;border:2px solid ${INK};border-radius:999px;padding:3px 11px;flex-shrink:0">NOVO</span>` : ''}
  </div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
*{box-sizing:border-box}
body{margin:0;background:${CREME};color:${INK};font-family:system-ui,-apple-system,sans-serif;width:1080px;padding:52px 46px 46px}
</style></head><body>

<!-- ═══ CAPA ═══ -->
<div style="display:flex;align-items:center;gap:20px;margin-bottom:10px">
  ${marca(100)}
  <div>
    <div style="display:inline-block;background:${MARINHO};color:#fff;border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};padding:6px 16px;${OSW};font-weight:700;font-size:17px;letter-spacing:1.2px;text-transform:uppercase">🏐 Proposta de parceria</div>
    <h1 style="${OSW};font-weight:700;font-size:58px;line-height:1.2;margin:10px 0 0;text-transform:uppercase">
      Futevôlei Depressão<br><span style="color:${GREEN}">dentro do Leilão Legends</span></h1>
  </div>
</div>
<!-- o cara do outro lado NÃO conhece o jogo: essa faixa é o "o que é isso" -->
<div style="${box('#fff')};padding:18px 22px;margin:16px 0 18px;display:flex;gap:22px;align-items:center">
  <div style="flex:1">
    <p style="${OSW};font-weight:700;font-size:19px;margin:0 0 5px;text-transform:uppercase">O que é o Leilão Legends</p>
    <p style="font-size:16.5px;font-weight:600;line-height:1.4;margin:0">Um jogo de <b>leilão às cegas de lendas do futebol</b>: você dá lance escondido, monta um time com as cartas que arrematar e disputa uma carreira, de várzea até a Série A. Roda <b>direto no navegador</b>, de graça, sem baixar nada.</p>
  </div>
  <div style="display:flex;gap:10px;flex-shrink:0">
    ${[['~7 mil', 'contas no 1º mês'], ['700+', 'jogadores no baralho'], ['0', 'download']]
      .map(([n, s]) => `<span style="text-align:center;background:#FBF6E9;border:3px solid ${INK};border-radius:12px;padding:9px 13px;min-width:104px">
        <b style="display:block;${OSW};font-weight:700;font-size:24px;line-height:1">${n}</b>
        <b style="display:block;font-size:11px;font-weight:800;opacity:.6;text-transform:uppercase;margin-top:2px">${s}</b></span>`).join('')}
  </div>
</div>
<p style="font-size:21px;font-weight:600;line-height:1.45;margin:0 0 34px;max-width:930px">
  Cinco lugares onde a marca entra — <b>sem virar banner</b>. Em todos eles a piada é a mesma da página:
  quem não tem mais nada pra fazer no futebol vai parar na areia.
</p>

<!-- ═══ 1 · O TORNEIO ═══ -->
${titulo(1, '🏐', 'O torneio dos últimos 4 da Várzea', 'Fim da temporada do Modo Carreira. Os 4 últimos da Várzea são o fundo do mundo: não sobem, não caem (não tem divisão abaixo) e já caíram fora da copa. Sobrou a areia.')}
<div style="${box('#fff')};padding:22px 24px;margin-bottom:20px">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;border-bottom:3px dashed rgba(0,0,0,.15);padding-bottom:14px">
    ${marca(52)}
    <div style="flex:1"><p style="${OSW};font-weight:700;font-size:11px;letter-spacing:1.4px;margin:0;opacity:.55;text-transform:uppercase">Apresenta</p>
    <p style="${OSW};font-weight:700;font-size:30px;margin:0;line-height:1">Copa da Depressão</p></div>
    <span style="text-align:center;background:${GOLD};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:8px 14px">
      <b style="display:block;font-size:26px;line-height:1">🩴</b>
      <b style="display:block;${OSW};font-weight:700;font-size:12px;text-transform:uppercase">Chinelo de Ouro</b>
      <b style="display:block;font-size:10px;font-weight:800;opacity:.6">0 ponto no ranking</b></span>
  </div>
  <div style="display:flex;gap:20px;align-items:flex-start">
    <div style="flex:1">
      <p style="${OSW};font-weight:700;font-size:17px;margin:0 0 9px;text-transform:uppercase;opacity:.6">Semifinal · jogo único</p>
      ${duelo('17º', 'Perna de Pau City', 18, '20º', 'Canelada Real', 15, true)}
      ${duelo('18º', 'Meia-Boca FC', 16, '19º', 'Trave Torta EC', 18, false)}
      <p style="${OSW};font-weight:700;font-size:17px;margin:18px 0 9px;text-transform:uppercase;opacity:.6">Final</p>
      ${duelo('17º', 'Perna de Pau City', 18, '19º', 'Trave Torta EC', 16, true)}
    </div>
    <div style="width:330px">
      <div style="${box('#FBF6E9', 14)};padding:16px 18px;margin-bottom:12px">
        <p style="${OSW};font-weight:700;font-size:19px;margin:0 0 10px;text-transform:uppercase">Como funciona</p>
        ${[['4️⃣', 'Só os 4 últimos da Várzea', 'exatamente 2 semis + 1 final'],
           ['🎲', 'A dupla é SORTEADA', 'o jogo tira 2 do elenco — você não escolhe'],
           ['🏐', 'Set único até 18', 'ida só, sem volta. 18×15, 18×16'],
           ['⚡', '3 jogos, 30 segundos', 'tudo de uma vez, um toque pra pular']]
          .map(([e, t, s]) => `<div style="display:flex;gap:9px;margin-bottom:9px">
            <span style="font-size:19px;flex-shrink:0">${e}</span>
            <span><b style="display:block;${OSW};font-weight:700;font-size:15px;line-height:1.2">${t}</b>
            <b style="display:block;font-size:13px;font-weight:700;opacity:.6;line-height:1.25">${s}</b></span></div>`).join('')}
      </div>
      <div style="${box(MARINHO, 14)};padding:14px 16px;color:#fff">
        <p style="font-size:15px;font-weight:600;line-height:1.4;margin:0">🎲 <b>Sorteada de propósito:</b> ninguém monta dupla, ninguém pensa. Cai quem cair — e é aí que dá a zoeira de o goleiro ir pra areia.</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══ 2 · A QUADRA ═══ -->
${titulo(2, '🏖️', 'A tela da partida — a quadra é de vocês', 'É ISTO que aparece na hora do jogo: sua dupla de um lado da rede, a dupla do adversário do outro, o placar rolando. A marca fica NA REDE, no meio da tela.')}
<div style="${box('#fff')};overflow:hidden;margin-bottom:38px">
  <div style="background:linear-gradient(180deg,#BFE3F5 0%,#BFE3F5 14%,${AREIA} 14%,${AREIA2} 100%);padding:16px 26px 20px">

    <!-- placar -->
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;background:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:4px 4px 0 rgba(0,0,0,.25);padding:9px 18px;color:#fff;max-width:640px;margin:0 auto 14px">
      <b style="${OSW};font-weight:700;font-size:17px;flex:1;text-align:right">Canelada Real</b>
      <b style="${OSW};font-weight:700;font-size:30px;color:#9AA6B8">15</b>
      <b style="${OSW};font-weight:700;font-size:14px;opacity:.45">SET 1</b>
      <b style="${OSW};font-weight:700;font-size:30px;color:${GOLD}">18</b>
      <b style="${OSW};font-weight:700;font-size:17px;flex:1">Perna de Pau City</b>
    </div>

    <!-- LADO DE LÁ: dupla do adversário -->
    <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:6px">
      <b style="${OSW};font-weight:700;font-size:14px;text-transform:uppercase;opacity:.55;width:150px;text-align:right">Dupla do adversário</b>
      ${mini('Sarrafo', 'ZAG', 'Canelada Real', 92)}
      ${mini('Torto', 'MEI', 'Canelada Real', 92)}
      <span style="width:150px"></span>
    </div>

    <!-- A REDE, com a marca -->
    <div style="position:relative;margin:8px -26px 10px">
      <div style="position:absolute;left:24px;top:-26px;width:11px;height:74px;background:${INK};border-radius:4px"></div>
      <div style="position:absolute;right:24px;top:-26px;width:11px;height:74px;background:${INK};border-radius:4px"></div>
      <div style="background:${MARINHO};border-top:4px solid ${INK};border-bottom:4px solid ${INK};height:54px;
                  display:flex;align-items:center;justify-content:center;gap:14px;color:#fff;${OSW};font-weight:700;font-size:22px;letter-spacing:2px">
        ${marca(38)} FUTEVÔLEI DEPRESSÃO ${marca(38)}
      </div>
      <b style="position:absolute;right:34px;top:60px;${OSW};font-weight:700;font-size:12px;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:2px 10px">☝️ a rede é o espaço da marca</b>
    </div>

    <!-- LADO DE CÁ: a SUA dupla -->
    <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-top:22px">
      <b style="${OSW};font-weight:700;font-size:14px;text-transform:uppercase;width:150px;text-align:right">🎲 A sua dupla<br><span style="font-weight:700;font-size:12px;opacity:.6;text-transform:none">sorteada do seu elenco</span></b>
      ${mini('Edmundo', 'ATA', 'Vasco · 1997', 106)}
      ${mini('Renato Gaúcho', 'ATA', 'Grêmio · 1983', 106)}
      <div style="width:150px;background:rgba(255,255,255,.94);border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:9px 10px">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">${marca(28)}<b style="${OSW};font-weight:700;font-size:13px">🎾 Busca-bola</b></div>
        <b style="font-size:11.5px;font-weight:700;opacity:.65;line-height:1.25;display:block">Quem é bico na areia não joga: cata bola pro Depressão.</b>
      </div>
    </div>
  </div>
  <div style="padding:16px 22px;border-top:4px solid ${INK}">
    <span style="font-size:17px;font-weight:700;line-height:1.35">🩴 <b>Na areia a lógica vira:</b> zagueirão brucutu é perna-de-pau, folclórico e driblador viram monstro, e goleiro nem entra. <b>Nenhuma carta nova</b> — o mesmo baralho pontua por outra conta.</span>
  </div>
</div>

<!-- ═══ 3 · O BICO ═══ -->
${titulo(3, '🕴️', 'Bico de Folga — o 5º da lista', 'Isso JÁ EXISTE no jogo. Clube pequeno não paga bem, então o jogador arruma um bico num patrocinador pra ajudar no caixa. Hoje são 4 marcas; a marca vira a 5ª.')}
<div style="${box('#fff')};padding:20px 22px;margin-bottom:38px">
  <div style="display:flex;align-items:center;gap:12px;background:linear-gradient(160deg,${GREEN},#0e4a22);border:3px solid ${INK};border-radius:14px;padding:13px 15px;color:#fff;margin-bottom:16px">
    ${marca(48)}
    <div style="flex:1">
      <p style="font-size:11px;letter-spacing:1.3px;text-transform:uppercase;opacity:.6;font-weight:800;margin:0">🕴️ Seu bico de folga</p>
      <p style="${OSW};font-weight:700;font-size:22px;margin:1px 0 0;line-height:1">Futevôlei Depressão</p>
      <p style="font-size:14px;font-weight:700;opacity:.8;margin:1px 0 0">busca-bola na quadra de areia</p>
    </div>
    <span style="text-align:center;background:rgba(255,196,0,.16);border:2px solid ${GOLD};border-radius:10px;padding:6px 12px">
      <b style="display:block;${OSW};font-weight:700;font-size:22px;color:${GOLD}">+4🪙</b>
      <b style="display:block;font-size:9px;font-weight:800;opacity:.7;text-transform:uppercase">por temporada</b></span>
  </div>
  <p style="${OSW};font-weight:700;font-size:16px;margin:0 0 10px;text-transform:uppercase;opacity:.6">Trocar de bico</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
    ${bicoLinha('🚗', '#FDE68A', 'Vadico Veículos', 'vendedor nas folgas', false)}
    ${bicoLinha('💍', '#F5D0E8', 'Max Jóias', 'atendente na loja', false)}
    ${bicoLinha('🦷', '#CFE8FB', 'Ero Dentista', 'recepcionista', false)}
    ${bicoLinha('🎨', '#FBD0C6', 'Rei das Tintas', 'pintor de parede nas folgas', false)}
    ${bicoLinha(null, null, 'Futevôlei Depressão', 'busca-bola na quadra de areia', true)}
    <div style="display:flex;align-items:center;border:3px dashed rgba(0,0,0,.2);border-radius:12px;padding:9px 14px;background:rgba(0,0,0,.02)">
      <b style="font-size:14px;font-weight:700;opacity:.5;line-height:1.3">Bico só vale na <b>Várzea</b> e na <b>Série D</b> — quem já é grande se sustenta sozinho.</b>
    </div>
  </div>
</div>

<!-- ═══ 4 · O PATROCÍNIO ═══ -->
${titulo(4, '🤝', 'Patrocinador do clube', 'Outro lugar que já existe: no começo da temporada você escolhe um patrocinador e aposta numa meta. A marca entra na lista, do lado do Vadico e do Rei das Tintas.')}
<div style="display:flex;gap:18px;margin-bottom:38px">
  <div style="${box('#fff')};flex:1;padding:20px 22px">
    <p style="${OSW};font-weight:700;font-size:17px;margin:0 0 4px;text-transform:uppercase">Meta: não cair 🛟</p>
    <p style="font-size:14px;font-weight:700;opacity:.6;margin:0 0 12px">A meta mais fácil — e a mais depressiva. É onde a marca deles se encaixa.</p>
    ${[['🥖', 'Padaria do Zé', false], ['🥩', 'Açougue Bom Corte', false], [null, 'Futevôlei Depressão', true]]
      .map(([ic, nome, novo]) => `
      <div style="display:flex;align-items:center;gap:12px;border:3px solid ${novo ? MARINHO : INK};border-radius:12px;padding:10px 13px;margin-bottom:9px;background:${novo ? '#EAF0FB' : '#FBF6E9'}">
        ${ic ? `<span style="width:42px;height:42px;border-radius:10px;border:3px solid ${INK};background:#EDE6D2;display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0">${ic}</span>` : marca(42)}
        <b style="flex:1;${OSW};font-weight:700;font-size:18px">${nome}</b>
        ${novo ? `<span style="${OSW};font-weight:700;font-size:12px;background:${MARINHO};color:#fff;border:2px solid ${INK};border-radius:999px;padding:3px 11px">NOVO</span>` : ''}
      </div>`).join('')}
    <p style="font-size:13.5px;font-weight:700;opacity:.55;margin:10px 0 0;line-height:1.35">As outras metas (acesso e título) têm as marcas de sempre: Espetinho, Rei das Tintas, Guaraná, Vadico, ERO, Diamante.</p>
  </div>
  <div style="${box(MARINHO)};width:340px;padding:20px;color:#fff">
    <p style="${OSW};font-weight:700;font-size:20px;margin:0 0 10px;text-transform:uppercase">Por que na meta "não cair"</p>
    <p style="font-size:16px;font-weight:600;line-height:1.45;margin:0 0 12px">Porque é a meta de quem <b>já desistiu de ganhar</b> e só quer sobreviver o ano.</p>
    <p style="font-size:16px;font-weight:600;line-height:1.45;margin:0">Se ele preferir aparecer na meta de título, também dá — é só trocar de lista. Mas a piada mora aqui.</p>
  </div>
</div>

<!-- ═══ 5 · A ZOEIRA ═══ -->
${titulo(5, '😂', 'O jogador faltou no treino — foi jogar futevôlei', 'Alguns nomes do baralho já têm o selo 🃏 FOLCLÓRICO no jogo. Antes da partida, o clube recebe um AVISO: o cara sumiu. E o aviso vem assinado pela marca.')}
<div style="display:flex;gap:14px;margin-bottom:14px">
  ${[['Renato Gaúcho', 'Grêmio · 1983', 'R',
      'Faltou no treino da semana inteira. Foi visto na rede da praia — e ganhou lá também.',
      '❌ Fora da próxima partida'],
     ['Romário', 'Vasco · 2000', 'R',
      'Chegou 10 minutos antes do jogo. Na areia, chegou 3 horas antes e ficou até o sol cair.',
      '❌ Fora da próxima partida'],
     ['Edmundo', 'Vasco · 1997', 'E',
      'Sumiu com a bola pra jogar futevôlei e voltou torrado de sol. Não vai render nada hoje.',
      '⚠️ Joga, mas rende menos']]
    .map(([n, c, ini, f, efeito]) => `
    <div style="${box('#fff')};flex:1;overflow:hidden">
      <div style="background:${MARINHO};color:#fff;padding:8px 14px;display:flex;align-items:center;gap:8px">
        ${marca(26)}<b style="${OSW};font-weight:700;font-size:12.5px;letter-spacing:.8px;text-transform:uppercase">Aviso antes da partida</b>
      </div>
      <div style="padding:14px 16px">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px">
          <span style="width:38px;height:38px;border-radius:50%;background:linear-gradient(150deg,#41C07A,#1E7A45);border:2.5px solid ${INK};color:#fff;${OSW};font-weight:700;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${ini}</span>
          <span style="min-width:0;flex:1"><b style="display:block;${OSW};font-weight:700;font-size:16px;line-height:1.1">${n}</b>
          <b style="display:block;font-size:11.5px;font-weight:800;opacity:.55">${c}</b></span>
          <span style="font-size:10px;${OSW};font-weight:700;background:${GOLD};border:2px solid ${INK};border-radius:999px;padding:2px 8px;flex-shrink:0">🃏 FOLK</span>
        </div>
        <p style="font-size:15px;font-weight:600;font-style:italic;line-height:1.4;margin:0 0 12px;min-height:88px">“${f}”</p>
        <div style="background:#FBF6E9;border:2.5px solid ${INK};border-radius:10px;padding:8px 11px;text-align:center">
          <b style="${OSW};font-weight:700;font-size:14.5px">${efeito}</b>
        </div>
      </div>
    </div>`).join('')}
</div>
<div style="${box('#FBF6E9')};padding:16px 20px;margin-bottom:34px;display:flex;gap:20px;align-items:center">
  <span style="font-size:34px;flex-shrink:0">🛟</span>
  <div>
    <p style="${OSW};font-weight:700;font-size:17px;margin:0 0 4px;text-transform:uppercase">E ninguém é pego de surpresa</p>
    <p style="font-size:15.5px;font-weight:600;line-height:1.4;margin:0">O aviso aparece <b>ANTES de você escalar o time</b>, não no meio do jogo. Só acontece com carta <b>🃏 folclórico</b>, e só na <b>Várzea e Série D</b> — carreira grande não é atrapalhada. Você troca o cara e joga normal.</p>
  </div>
</div>

<!-- ═══ RODAPÉ ═══ -->
<div style="${box('#fff')};padding:20px 24px;display:flex;gap:20px;align-items:center">
  ${marca(64)}
  <div style="flex:1">
    <p style="${OSW};font-weight:700;font-size:22px;margin:0;text-transform:uppercase">Nada disso atrasa o jogo</p>
    <p style="font-size:16px;font-weight:600;line-height:1.4;margin:5px 0 0">Tudo entra em <b>tempo morto</b>: o torneio é no fim da temporada, quando os 4 últimos da Várzea já não têm mais jogo nenhum. São 3 partidas de um set. Um toque pra jogar, um toque pra pular.</p>
  </div>
</div>
<p style="margin:22px 0 0;${OSW};font-weight:700;font-size:24px;display:flex;justify-content:space-between;align-items:baseline">
  <span>⚽ Leilão <span style="color:${RED}">Legends</span></span>
  <span style="font-size:17px;opacity:.5">leilaolegends.com · mockup, ainda não está no ar</span></p>

</body></html>`

const tmp = `/tmp/mockup-futevolei-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1080, height: 1400 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA + (logoSrc ? ' · com logo real' : ' · SEM logo (passe --logo)'))
