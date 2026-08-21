// ─── 🛡️ MOCKUP: CLÃS (a casa que vários jogadores vestem) ───────────────────
//
// Pergunta do Diego (20/08): *"Como seria uma nova função com clãs?"*
//
// A IDEIA EM UMA FRASE: **clã é uma CASA**. Você entra, veste o escudo dela, e
// tudo que você ganha em QUALQUER sala vira ponto pra casa.
//
// ⚠️ POR QUE ISSO NÃO É A LIGA FECHADA (a pergunta que vem logo depois):
//   · Liga Fechada é uma **SALA** — dia marcado, mesma turma, troféu daquela sala.
//   · Clã é uma **IDENTIDADE** — te acompanha em TODA sala que você entrar.
//   Dá pra ter os dois ao mesmo tempo, e um não atrapalha o outro.
//
// 🧱 O QUE ELE REAPROVEITA (por isso é barato de fazer):
//   · a arte de BATISMO (escudo .webp + mascote + manto) já existe e já é do
//     e-mail do dono — o clã é o MESMO material vestido por várias pessoas;
//   · os tiers de apoio (`apoio.tsx`) já dão cor por usuário — o clã NÃO mexe
//     nisso: cada um continua com a cor do PRÓPRIO tier (regra de ouro do Diego);
//   · o ranking global já soma título/artilharia — o clã só agrupa o que já existe.
//
// 🚦 O QUE ESTA FOLHA NÃO DECIDE (é o Diego quem escolhe, está marcado em amarelo):
//   1. quem pode ABRIR um clã;  2. quantos cabem;  3. se a Guerra de Clãs entra
//   já ou fica pra depois.
//
//   node scripts/mockup-clas.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'clas.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED', NOITE = '#1B2A5B'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'

const btn = (txt, bg = '#fff', cor = INK, extra = '') =>
  `<div style="border:3px solid ${INK};border-radius:12px;background:${bg};color:${cor};box-shadow:3px 3px 0 ${INK};
     ${OSW};font-size:15px;text-align:center;padding:10px 12px;${extra}">${txt}</div>`
const seg = (opts, sel) => `<div style="display:flex;border:3px solid ${INK};border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 ${INK}">
  ${opts.map((o, i) => `<div style="flex:1;padding:9px 6px;text-align:center;${OSW};font-size:13.5px;
    background:${i === sel ? GOLD : '#fff'};color:${INK};${i ? `border-left:3px solid ${INK}` : ''}">${o}</div>`).join('')}</div>`
const caixa = (inner, bg = '#fff', pad = '14px 16px') =>
  `<div style="background:${bg};border:4px solid ${INK};border-radius:18px;box-shadow:4px 4px 0 ${INK};padding:${pad}">${inner}</div>`
const rot = t => `<div style="${OSW};text-transform:uppercase;font-size:12px;letter-spacing:.09em;opacity:.55;margin:0 0 7px">${t}</div>`
const h2 = (n, t, s = '') => `<h2 style="${OSW};text-transform:uppercase;font-size:23px;margin:34px 0 12px;display:flex;align-items:baseline;gap:10px">
  <span style="background:${INK};color:#fff;border-radius:8px;padding:2px 10px;font-size:17px">${n}</span>${t}
  ${s ? `<small style="font-family:system-ui;font-weight:600;font-size:13px;text-transform:none;opacity:.55">${s}</small>` : ''}</h2>`
const NOVO = `<span style="background:${GREEN};color:#fff;${OSW};font-size:10px;border-radius:6px;padding:2px 7px;letter-spacing:.06em">NOVO</span>`
const JA = `<span style="background:rgba(12,12,12,.12);color:rgba(12,12,12,.6);${OSW};font-size:10px;border-radius:6px;padding:2px 7px;letter-spacing:.06em">JÁ EXISTE</span>`
const VOCE = `<span style="background:${GOLD};color:${INK};${OSW};font-size:10px;border-radius:6px;padding:2px 7px;letter-spacing:.06em;border:2px solid ${INK}">VOCÊ ESCOLHE</span>`
const campo = (v, w = 'auto') => `<div style="border:3px solid ${INK};border-radius:10px;background:#fff;padding:7px 11px;${OSW};font-size:14px;min-width:${w};display:inline-block">${v}</div>`

// escudo fake só pro mockup (no jogo é a arte .webp do batismo, que já existe)
const escudo = (size, c1 = '#C2452F', c2 = '#1B2A5B', letra = 'R') => `
  <svg width="${size}" height="${size}" viewBox="0 0 64 70" style="flex:none">
    <path d="M32 2 L60 12 V38 C60 54 46 64 32 68 C18 64 4 54 4 38 V12 Z" fill="${c2}" stroke="${INK}" stroke-width="4"/>
    <path d="M32 2 L60 12 V38 C60 54 46 64 32 68 Z" fill="${c1}"/>
    <text x="32" y="46" text-anchor="middle" ${OSW.replace('font-family', 'font-family')} font-size="30" fill="#fff" stroke="${INK}" stroke-width="1.5">${letra}</text>
  </svg>`

// ── 1 · o que é um clã ───────────────────────────────────────────────────────
const p1 = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
  ${caixa(`${rot(`Clã × Liga Fechada — não é a mesma coisa`)}
    <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px">
      <span style="font-size:26px;line-height:1">🏆</span>
      <p style="font-size:13px;font-weight:600;line-height:1.45;margin:0">
        <b style="${OSW};text-transform:uppercase">Liga Fechada é uma SALA.</b><br>
        Dia marcado, sempre a mesma turma, e os troféus ficam <b>guardados naquela sala</b>.
        Você só ganha troféu de liga <b>jogando lá dentro</b>.</p>
    </div>
    <div style="height:2px;background:rgba(12,12,12,.12);margin:0 0 12px"></div>
    <div style="display:flex;gap:12px;align-items:flex-start">
      <span style="font-size:26px;line-height:1">🛡️</span>
      <p style="font-size:13px;font-weight:600;line-height:1.45;margin:0">
        <b style="${OSW};text-transform:uppercase">Clã é uma IDENTIDADE.</b><br>
        Ele <b>vai com você</b> pra qualquer sala do jogo. Ganhou em qualquer lugar?
        Contou pro clã. É o que faz a galera se sentir de um <b>time</b> mesmo fora da resenha marcada.</p>
    </div>
    <p style="font-size:12.5px;font-weight:700;color:${GREEN};margin:12px 0 0">✅ Dá pra ter os dois. Um não atrapalha o outro.</p>`, '#F8F4E8')}
  ${caixa(`${rot(`As 3 coisas que um clã faz ${NOVO}`)}
    ${[['🛡️', 'Você VESTE', 'O escudo e o mascote do clã aparecem do lado do seu nome em <b>toda sala</b>. A galera vê de longe quem é de qual casa.'],
       ['📈', 'Tudo CONTA', 'Título, copa, artilharia, carta nova — o que você ganha em qualquer modo <b>vira ponto do clã</b>.'],
       ['⚔️', 'Casa contra casa', 'O ranking de clãs na home, e a <b>Guerra de Clãs</b>: uma sala com dois clãs frente a frente.']]
      .map(([e, t, d]) => `<div style="display:flex;gap:11px;align-items:flex-start;margin-bottom:11px">
        <span style="font-size:22px;line-height:1.1">${e}</span>
        <p style="font-size:12.5px;font-weight:600;line-height:1.42;margin:0">
          <b style="${OSW};text-transform:uppercase;font-size:13px">${t}</b><br>${d}</p></div>`).join('')}`)}
</div>`

// ── 2 · a carteirinha do clã (o que aparece no jogo todo) ────────────────────
const membro = (nome, tier, cor, papel, pts) => `
  <div style="display:flex;align-items:center;gap:9px;border:3px solid ${INK};border-radius:12px;background:#fff;padding:7px 11px;margin-bottom:7px;box-shadow:2px 2px 0 ${INK}">
    ${escudo(24, '#C2452F', '#1B2A5B', 'R')}
    <span style="${OSW};font-size:14px;flex:1;min-width:0">${nome} <span style="font-size:12px;color:${cor}">${tier}</span></span>
    ${papel ? `<span style="${OSW};font-size:10.5px;background:${INK};color:#fff;border-radius:6px;padding:2px 8px">${papel}</span>` : ''}
    <span style="${OSW};font-size:14px;min-width:44px;text-align:right">${pts}</span>
  </div>`

const p2 = `<div style="display:grid;grid-template-columns:1.15fr 1fr;gap:18px">
  ${caixa(`
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
      ${escudo(60)}
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:25px;margin:0">Resenha FC</p>
        <p style="font-size:12.5px;font-weight:700;color:rgba(12,12,12,.6);margin:3px 0 0">🛡️ 7 de 12 membros · fundado na T4 · código <b>CLA-9K2</b></p>
      </div>
      <div style="background:${NOITE};color:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:6px 12px;text-align:center">
        <div style="${OSW};font-size:10px;opacity:.8">NO RANKING</div><div style="${OSW};font-size:19px;color:${GOLD}">3º</div></div>
    </div>
    ${rot('Quem é da casa · e quanto cada um trouxe')}
    ${membro('Nata de SP', '👑', GOLD, 'DONO', '340')}
    ${membro('Skyy FC', '👑', GOLD, 'CAPITÃO', '295')}
    ${membro('Tôka10', '⭐', '#8b8b8b', '', '210')}
    ${membro('Marreco FC', '💎', PURPLE, '', '155')}
    ${membro('Você', '💎', PURPLE, '', '120')}
    <p style="font-size:11.5px;font-weight:700;color:rgba(12,12,12,.5);margin:9px 0 0">
      🎨 Cada um continua com a <b>cor do próprio tier</b> (grátis = bege, ouro = ouro). O clã dá o ESCUDO, nunca a cor de outro.</p>`)}
  <div style="display:flex;flex-direction:column;gap:18px">
    ${caixa(`${rot(`Como o clã aparece nas OUTRAS telas ${NOVO}`)}
      <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.6);margin:0 0 9px">É só um escudinho do lado do nome. Nada de passo novo, nada de espera.</p>
      <div style="border:3px solid ${INK};border-radius:12px;background:#F8F4E8;padding:9px 11px">
        <div style="${OSW};font-size:10.5px;opacity:.5;margin-bottom:6px">NO LOBBY DA SALA</div>
        ${['Nata de SP', 'Você', 'Murriz FC'].map((n, i) => `<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">
          ${i === 2 ? '<div style="width:18px"></div>' : escudo(18)}
          <span style="${OSW};font-size:13px">${n}</span>
          ${i === 2 ? '<span style="font-size:10.5px;font-weight:700;opacity:.4">sem clã</span>' : ''}</div>`).join('')}
      </div>
      <div style="height:9px"></div>
      <div style="border:3px solid ${INK};border-radius:12px;background:#F8F4E8;padding:9px 11px">
        <div style="${OSW};font-size:10.5px;opacity:.5;margin-bottom:6px">NA TABELA DO CAMPEONATO</div>
        <div style="display:flex;align-items:center;gap:7px">
          <span style="${OSW};font-size:13px;opacity:.5">1º</span>${escudo(18)}
          <span style="${OSW};font-size:13px;flex:1">Nata de SP</span><span style="${OSW};font-size:13px">74</span></div>
      </div>`)}
    ${caixa(`${rot(`Entrar num clã ${NOVO}`)}
      <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:0 0 9px">
        Igual entrar numa sala: <b>o código</b>. O dono aceita, e pronto. <b>Um clã por pessoa</b> — senão ninguém sabe de quem você é.</p>
      ${campo('CLA-9K2', '120px')} <span style="display:inline-block;width:8px"></span> ${btn('Pedir pra entrar', GREEN, '#fff', 'display:inline-block;padding:8px 16px')}
      <p style="font-size:11.5px;font-weight:700;color:${RED};margin:10px 0 0">
        🚪 <b>Sair é sempre possível</b>, mas o que você já trouxe <b>fica com o clã</b> — senão dava pra esvaziar o troféu dos outros na saída.</p>`)}
  </div>
</div>`

// ── 3 · o ranking de clãs ────────────────────────────────────────────────────
const linhaCla = (pos, nome, membros, pts, destaque) => `
  <tr style="background:${destaque ? 'rgba(255,196,0,.14)' : 'transparent'}">
    <td style="padding:9px 8px;${OSW};font-size:15px;opacity:.55;width:38px">${pos}º</td>
    <td style="padding:9px 4px;width:34px">${escudo(26, pos === 1 ? '#1B7A3D' : pos === 2 ? '#7C3AED' : '#C2452F', '#1B2A5B', nome[0])}</td>
    <td style="padding:9px 8px;${OSW};font-size:15px">${nome}${destaque ? ' <span style="font-size:11px;color:rgba(12,12,12,.5)">(o seu)</span>' : ''}</td>
    <td style="padding:9px 8px;font-size:12.5px;font-weight:700;color:rgba(12,12,12,.6)">👥 ${membros}</td>
    <td style="padding:9px 8px;${OSW};font-size:16px;text-align:right">${pts}</td>
  </tr>`

const p3 = `<div style="display:grid;grid-template-columns:1.25fr 1fr;gap:18px">
  ${caixa(`${rot(`Ranking de clãs — na home, do lado do ranking de gente ${NOVO}`)}
    <table style="width:100%;border-collapse:collapse">
      <tr style="${OSW};font-size:11px;opacity:.45;text-transform:uppercase">
        <td style="padding:0 8px 6px">#</td><td></td><td style="padding:0 8px 6px">Clã</td>
        <td style="padding:0 8px 6px">Gente</td><td style="padding:0 8px 6px;text-align:right">Pontos</td></tr>
      ${linhaCla(1, 'Manada FC', 12, '1.480')}
      ${linhaCla(2, 'Zona Norte', 9, '1.205')}
      ${linhaCla(3, 'Resenha FC', 7, '1.120', true)}
      ${linhaCla(4, 'Os Cria', 11, '980')}
      ${linhaCla(5, 'Várzea Unida', 6, '640')}
    </table>
    <p style="font-size:11.5px;font-weight:700;color:rgba(12,12,12,.5);margin:10px 0 0">
      ⚖️ <b>Clã grande não ganha só por ser grande:</b> conta a <b>média</b> por membro, não a soma. Senão o clã de 30 pessoas
      atropela o de 5 sem jogar melhor.</p>`)}
  ${caixa(`${rot(`De onde vem o ponto do clã ${VOCE}`)}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.65);line-height:1.4;margin:0 0 10px">
      Sugestão pra começar — <b>é você quem fecha os números</b>, igual fizemos no ranking da Liga Fechada:</p>
    ${[['🏆', 'Título da liga', '20'], ['🏆', 'Copa / Libertadores', '30'], ['⚽', 'Artilheiro', '5'],
       ['🃏', 'Carta nova no álbum', '2'], ['🔻', 'Rebaixamento', '−10']]
      .map(([e, t, v]) => `<div style="display:flex;align-items:center;gap:8px;border:3px solid ${INK};border-radius:11px;background:#fff;padding:7px 11px;margin-bottom:6px;box-shadow:2px 2px 0 ${INK}">
        <span style="font-size:15px">${e}</span><span style="${OSW};font-size:13.5px;flex:1">${t}</span>
        <span style="${OSW};font-size:13px;background:${GOLD};border:2px solid ${INK};border-radius:7px;padding:1px 9px">${v}</span></div>`).join('')}`, '#FFFDF5')}
</div>`

// ── 4 · guerra de clãs ───────────────────────────────────────────────────────
const p4 = caixa(`
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px">
    <div><p style="${OSW};font-size:24px;margin:0">⚔️ Guerra de Clãs</p>
      <p style="font-size:13px;font-weight:700;color:rgba(12,12,12,.6);margin:3px 0 0">uma sala normal, com os assentos divididos em dois lados</p></div>
    ${VOCE}
  </div>
  <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center;margin-bottom:14px">
    ${[[GREEN, 'Resenha FC', '4 no pregão'], [null, null, null], [PURPLE, 'Manada FC', '4 no pregão']].map(([c, n, s]) =>
      c === null ? `<div style="${OSW};font-size:26px;opacity:.3">×</div>`
        : `<div style="border:4px solid ${INK};border-radius:16px;background:${c};color:#fff;box-shadow:4px 4px 0 ${INK};padding:13px;text-align:center">
             <div style="display:flex;justify-content:center;margin-bottom:6px">${escudo(38, '#fff', 'rgba(255,255,255,.25)', n[0])}</div>
             <div style="${OSW};font-size:18px">${n}</div><div style="font-size:11.5px;font-weight:700;opacity:.85">${s}</div></div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
    ${caixa(`${rot('Como se ganha a guerra')}
      <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
        O campeonato roda <b>igualzinho</b>: mesmo leilão, mesmas 38 rodadas, mesma Copa. No fim, o jogo <b>soma a colocação
        de cada lado</b> — o clã que somar mais leva a guerra.<br><br>
        <b>Nada muda no meio do jogo.</b> A guerra é só uma conta a mais no fim, e o resultado entra no mural dos dois clãs:
        <i>"Resenha FC 3 × 1 Manada FC"</i>.</p>`, '#F8F4E8')}
    ${caixa(`${rot('⚠️ O cuidado que eu tomaria')}
      <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
        Guerra <b>só com os dois lados iguais</b> (4 contra 4, 5 contra 5). Se um lado tiver mais gente, o jogo <b>trava e
        explica</b> — "faltam 2 do Manada FC pra guerra valer" — em vez de deixar sair torto.<br><br>
        E <b>sem bot no lugar de gente</b>: bot não é de clã nenhum, e ninguém quer perder uma guerra pro robô.</p>`, '#FDF0EE')}
  </div>`)

// ── 5 · o que você precisa decidir ───────────────────────────────────────────
const p5 = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px">
  ${caixa(`${rot(`1 · Quem pode ABRIR um clã ${VOCE}`)}
    ${seg(['Só 👑 Lenda', 'Qualquer um'], 0)}
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.65);line-height:1.45;margin:10px 0 0">
      <b>Minha sugestão: só Lenda</b> — igual à Liga Fechada. Assim o escudo do clã pode ser a arte do batismo, que já existe
      e já é do e-mail do dono. <b>Entrar</b> num clã, aí sim, qualquer um pode.</p>`)}
  ${caixa(`${rot(`2 · Quantos cabem ${VOCE}`)}
    ${seg(['Até 12', 'Até 20', 'Sem limite'], 0)}
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.65);line-height:1.45;margin:10px 0 0">
      <b>Minha sugestão: 12.</b> Cabe a turma inteira numa sala e ainda sobra banco. Sem limite vira lista de e-mail, e aí
      ninguém conhece ninguém.</p>`)}
  ${caixa(`${rot(`3 · A Guerra entra já? ${VOCE}`)}
    ${seg(['Depois', 'Já'], 0)}
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.65);line-height:1.45;margin:10px 0 0">
      <b>Minha sugestão: depois.</b> Primeiro o clã existir e o escudo aparecer nas salas — isso sozinho já é a metade da
      graça. A guerra é o passo 2, com a casa já cheia.</p>`)}
</div>`

// ── 6 · o que muda e o que não muda ─────────────────────────────────────────
const p6 = caixa(`
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
    <div>
      <p style="font-size:13px;font-weight:600;line-height:1.55;margin:0 0 9px">
        ✅ <b>Metade já existe.</b> O escudo, o mascote, o manto e a trava por conta são o material do <b>batismo</b>, que já
        está no jogo. O clã é esse mesmo material <b>vestido por várias pessoas</b>.</p>
      <p style="font-size:13px;font-weight:600;line-height:1.55;margin:0 0 9px">
        🔒 <b>O motor não é tocado.</b> Mesmo leilão, mesma temporada, mesmo fim de jogo. O clã é um <b>escudinho do lado do
        nome</b> e uma <b>conta a mais</b> no ranking.</p>
      <p style="font-size:13px;font-weight:600;line-height:1.55;margin:0">
        🎨 <b>Fidelidade de tier fica intacta.</b> O clã dá o ESCUDO — a COR continua sendo a do tier de cada um. Grátis vê
        bege, ouro vê ouro. Nenhuma cor emprestada.</p>
    </div>
    <div>
      <p style="font-size:13px;font-weight:600;line-height:1.55;margin:0 0 9px">
        🆕 <b>O que entra:</b> uma tabela de clãs no banco, a tela do clã, o escudinho nas listas e o ranking de clãs na home.</p>
      <p style="font-size:13px;font-weight:600;line-height:1.55;margin:0 0 9px">
        ⏱️ <b>Nada atrasa o jogo.</b> Nenhum passo novo no pregão, nenhuma espera. O escudo aparece junto com o nome, que já
        é desenhado hoje.</p>
      <p style="font-size:13px;font-weight:600;line-height:1.55;margin:0">
        ↩️ <b>Dá pra voltar atrás por pedaço.</b> Cada peça é um commit isolado — e enquanto estiver em construção, só a sua
        conta enxerga, igual à Liga Fechada e ao basquete.</p>
    </div>
  </div>
  <div style="height:14px"></div>
  <div style="border-top:3px solid rgba(12,12,12,.15);padding-top:12px">
    <p style="${OSW};font-size:14px;margin:0 0 7px;color:${RED}">⚠️ Duas coisas que eu preciso falar na cara</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
        <b>Clã morto é pior que clã nenhum.</b> Se a galera abrir 50 clãs de 1 pessoa, o ranking vira lixo. Por isso o clã só
        aparece no ranking com <b>3 membros ou mais</b> — antes disso ele existe, mas não pontua.</p>
      <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
        <b>Isso é a coisa mais social que o jogo teria.</b> É onde ele mais pode crescer sozinho (a pessoa chama o amigo pro
        clã), mas também onde dá briga — por isso o dono precisa poder <b>tirar gente</b>, e sair precisa ser fácil.</p>
    </div>
  </div>`, '#F1EDE0')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}body{margin:0;background:#F4ECD6;color:${INK};font-family:system-ui,-apple-system,sans-serif;padding:34px 30px 30px}</style></head><body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🛡️ MOCKUP · CLÃS</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:47px;margin:14px 0 6px;line-height:1">
    O CLÃ É UMA <span style="color:${RED}">CASA</span></h1>
  <p style="font-size:15px;font-weight:600;max-width:900px;line-height:1.5;margin:0">
    Você entra, <b>veste o escudo dela</b>, e tudo que você ganha em qualquer sala do jogo <b>vira ponto pra casa</b>.
    A Liga Fechada é uma SALA que fica de pé; o clã é uma IDENTIDADE que anda com você. Dá pra ter os dois — e o
    motor do jogo não é tocado em nada.</p>

  ${h2(1, 'O que é um clã', 'e por que não é a Liga Fechada')}
  ${p1}
  ${h2(2, 'A casa por dentro', 'e como ela aparece no resto do jogo')}
  ${p2}
  ${h2(3, 'Casa contra casa', 'o ranking de clãs')}
  ${p3}
  ${h2(4, 'Guerra de clãs', 'o prato principal — mas não precisa entrar já')}
  ${p4}
  ${h2(5, 'O que você precisa decidir', 'três escolhas, e minha sugestão em cada uma')}
  ${p5}
  <div style="height:26px"></div>
  ${p6}
  <p style="margin-top:18px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-clas-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
