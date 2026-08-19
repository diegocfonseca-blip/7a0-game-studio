// ─── 🏆 MOCKUP: LIGA FECHADA (sala marcada, com dono que manda na liga) ──────
//
// Desenho pedido pelo Diego em 19/08. Regras ditadas por ele, na ordem:
//   1. É SEMPRE A MESMA SALA — é isso que faz o troféu acumular temporada após
//      temporada. Sala nova a cada encontro perderia o histórico.
//   2. Só entra quem é 👑 LENDA ou dono de clube batizado. Quem não é NEM VÊ a
//      sala. (Como todo batismo já nasce ouro pela regra de 17/08, a conta é
//      uma só: tier = ouro.)
//   3. Quem decide começar é o HOST, igual às salas de hoje: com 2 já dá.
//   4. Liga fechada é sem bot por natureza, mas o host escolhe se AQUELA sala
//      tem bot — e pode trocar depois, na mesma sala.
//   5. (20/08) O HOST MANDA NA LIGA: pode corrigir QUALQUER troféu de QUALQUER
//      pessoa (liga, copa, rebaixamento, artilheiro), incluir ou remover tipos
//      de troféu, e definir a REGRA do ranking — por ordem de títulos (e qual
//      vale mais) ou por pontuação que ele mesmo escolhe. O jogo dá a sugestão
//      de início; quem decide é ele. O que ele decidir vale TODA VEZ que
//      entrarem na sala, e dá pra mudar de novo quando quiser.
//      Palavras dele: *"às vezes pode dar erro, aí eles mesmos podem arrumar"*.
//
// ⚠️ NADA do que existe hoje é tocado: motor, leilão, temporada e fim de jogo
// seguem iguais. Tudo aqui é UM CAMPO A MAIS na sala + telas novas.
//
//   node scripts/mockup-liga-fechada.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'liga-fechada.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
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
const campo = (v, w = 'auto') => `<div style="border:3px solid ${INK};border-radius:10px;background:#fff;padding:7px 11px;${OSW};font-size:14px;min-width:${w};display:inline-block">${v}</div>`
const chip = (t, on) => `<span style="display:inline-flex;align-items:center;gap:5px;border:3px solid ${INK};border-radius:999px;padding:5px 12px;
  background:${on ? GREEN : '#fff'};color:${on ? '#fff' : 'rgba(12,12,12,.4)'};${OSW};font-size:13px;box-shadow:2px 2px 0 ${INK}">${on ? '✓' : '＋'} ${t}</span>`

// ── 1 · criar a liga ─────────────────────────────────────────────────────────
// 🎛️ (20/08) O Diego cortou: a Liga Fechada NÃO é um detalhe da partida, é MODO
// DE JOGO — fica na mesma fileira do Rápido, Carreira e Bafo. Palavras dele:
// *"tem q ser rápido, liga fechada, carreira e bafo"*. E cai como uma luva no
// padrão que já existe ali: quem não está liberado VÊ o botão apagado e sem
// clique — desperta o interesse sem deixar entrar no que não é dele.
const modo = (label, sel, apagado, sub) => `<div style="flex:1;padding:9px 3px;text-align:center;${OSW};font-size:12px;
  background:${sel ? GOLD : '#fff'};color:${INK};opacity:${apagado ? .4 : 1};line-height:1.15;border-left:3px solid ${INK}">
  ${label}${sub ? `<br><span style="font-size:8.5px">${sub}</span>` : ''}</div>`
const fileira = inner => `<div style="display:flex;border:3px solid ${INK};border-radius:12px;overflow:hidden;box-shadow:3px 3px 0 ${INK}">
  <div style="display:flex;flex:1;margin-left:-3px">${inner}</div></div>`

const p1 = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
  ${caixa(`${rot(`Modo de jogo — pra quem é 👑 Lenda ${NOVO}`)}
    ${fileira(modo('⚡ Rápido', false) + modo('🏆 Liga', true) + modo('🌐 Carreira', false) + modo('🃏 Bafo', false))}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.7);line-height:1.4;margin:9px 0 0">
      🏆 <b>A liga da sua turma:</b> mesma sala toda vez, horário marcado, e os troféus ficam guardados ali dentro.</p>
    <div style="height:14px"></div>
    ${rot('Pra quem ainda não é Lenda')}
    ${fileira(modo('⚡ Rápido', true) + modo('🏆 Liga', false, true, '👑 só Lenda') + modo('🌐 Carreira', false) + modo('🃏 Bafo', false))}
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.55);line-height:1.4;margin:9px 0 0">
      Ele <b>vê</b> que existe, mas não clica — do mesmo jeito que o jogo já faz hoje com a Carreira e o Bafo.</p>`, '#F8F4E8')}
  ${caixa(`${rot(`O que abre ao escolher 🏆 Liga ${NOVO}`)}
    <p style="${OSW};font-size:14px;margin:0 0 6px">📅 Quando vocês jogam</p>
    <div style="display:flex;gap:8px"><div style="flex:1.4">${btn('Sábado, 23 de agosto')}</div><div style="flex:.8">${btn('21:00')}</div></div>
    <p style="${OSW};font-size:14px;margin:14px 0 6px">🤖 Bots na tabela</p>
    ${seg(['Sem bots — só vocês', 'Com bots até 20'], 0)}
    <p style="${OSW};font-size:14px;margin:14px 0 6px">🏷️ Nome da liga</p>
    ${btn('Resenha dos Cria')}
    <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.62);line-height:1.4;margin:9px 0 0">
      <b>Dá pra trocar tudo depois</b>, na mesma sala. O resto (baralho, formação, ritmo) é igualzinho ao Rápido.</p>`)}
</div>`

// ── 2 · como aparece ─────────────────────────────────────────────────────────
const p2 = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
  ${caixa(`${rot('Pra quem é 👑 Lenda / dono de clube')}
    <div style="display:flex;align-items:center;gap:10px">
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:19px;margin:0">🏆 Resenha dos Cria</p>
        <p style="font-size:12.5px;font-weight:700;color:rgba(12,12,12,.6);margin:3px 0 0">👥 5 técnicos · KX7M2A · sem bots</p>
        <p style="${OSW};font-size:13px;color:${GREEN};margin:5px 0 0">📅 SÁBADO, 21:00 · faltam 2 dias</p>
      </div><div style="width:112px">${btn('Entrar', GREEN, '#fff')}</div></div>`)}
  ${caixa(`${rot('Pra quem NÃO é')}
    <div style="display:flex;align-items:center;gap:10px">
      <div style="flex:1;min-width:0">
        <p style="${OSW};font-size:19px;margin:0;color:rgba(12,12,12,.45)">🔒 Liga Fechada</p>
        <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.55);line-height:1.4;margin:5px 0 0">
          Só entra quem é <b>👑 Lenda</b> ou <b>dono de clube batizado</b>. Ela nem aparece na lista normal.</p>
      </div><div style="width:112px">${btn('Como virar', '#fff', PURPLE)}</div></div>`, '#F1EDE0')}
</div>`

// ── 3 · dentro da sala ───────────────────────────────────────────────────────
const linha = (t, campeao, copa, art, reb, alt) => `
  <tr style="background:${alt ? 'rgba(255,196,0,.10)' : 'transparent'}">
    <td style="padding:8px 6px;${OSW};font-size:13px;opacity:.5">T${t}</td>
    <td style="padding:8px 6px;${OSW};font-size:14px">🏆 ${campeao}</td>
    <td style="padding:8px 6px;font-size:12.5px;font-weight:600">🏆🇧🇷 ${copa}</td>
    <td style="padding:8px 6px;font-size:12.5px;font-weight:600">⚽ ${art}</td>
    <td style="padding:8px 6px;font-size:12.5px;font-weight:600;color:${RED}">🔻 ${reb}</td>
    <td style="padding:8px 4px;text-align:right"><span style="border:2px solid ${INK};border-radius:8px;padding:2px 8px;${OSW};font-size:12px;background:#fff">✏️</span></td>
  </tr>`

const p3 = caixa(`
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
    <div><p style="${OSW};font-size:24px;margin:0">🏆 Resenha dos Cria</p>
      <p style="font-size:13px;font-weight:700;color:rgba(12,12,12,.6);margin:3px 0 0">código KX7M2A · sem bots · liga fechada</p></div>
    <div style="background:${GREEN};color:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:7px 13px;text-align:center">
      <p style="${OSW};font-size:11px;margin:0;opacity:.85">PRÓXIMO JOGO</p>
      <p style="${OSW};font-size:17px;margin:1px 0 0">SÁB · 21:00</p></div>
  </div>
  <div style="height:3px;background:rgba(12,12,12,.1);margin:15px 0"></div>
  <p style="${OSW};font-size:16px;margin:0 0 4px">🏆 Sala de troféus da liga ${NOVO}</p>
  <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.55);margin:0 0 8px">
    Hoje ela só aparece no fim do jogo. Aqui fica <b>na espera</b> — e cada linha tem o ✏️ pro dono arrumar.</p>
  ${caixa(`<table style="width:100%;border-collapse:collapse">
      <tr style="${OSW};font-size:11px;opacity:.45;text-transform:uppercase">
        <td style="padding:2px 6px">Temp.</td><td style="padding:2px 6px">Campeão da liga</td>
        <td style="padding:2px 6px">Copa</td><td style="padding:2px 6px">Artilheiro</td><td style="padding:2px 6px">Rebaixados</td><td></td></tr>
      ${linha(1, 'Nata de SP', 'Skyy FC', 'Gabigol · 24', 'Murriz FC', false)}
      ${linha(2, 'Skyy FC', 'Nata de SP', 'Romário · 31', 'Tôka10', true)}
      ${linha(3, 'Nata de SP', 'Tôka10', 'Zico · 27', 'Marreco FC', false)}
    </table>`, '#FFF9E6', '8px 10px')}
  <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:16px;margin-top:16px">
    <div>
      <p style="${OSW};font-size:15px;margin:0 0 7px">👥 Quem já chegou · 3 de 5</p>
      ${['Nata de SP 👑', 'Skyy FC 👑', 'Tôka10 👑'].map(n => `
        <div style="display:flex;align-items:center;gap:8px;border:3px solid ${INK};border-radius:12px;background:#fff;padding:7px 11px;margin-bottom:7px;box-shadow:2px 2px 0 ${INK}">
          <span style="width:9px;height:9px;border-radius:50%;background:${GREEN}"></span><span style="${OSW};font-size:14.5px">${n}</span></div>`).join('')}
      ${['Marreco FC', 'Murriz FC'].map(n => `
        <div style="display:flex;align-items:center;gap:8px;border:3px dashed rgba(12,12,12,.3);border-radius:12px;padding:7px 11px;margin-bottom:7px">
          <span style="width:9px;height:9px;border-radius:50%;background:rgba(12,12,12,.2)"></span>
          <span style="${OSW};font-size:14.5px;opacity:.45">${n} · ainda não chegou</span></div>`).join('')}
    </div>
    <div>
      <p style="${OSW};font-size:15px;margin:0 0 7px">🎛️ Só o dono da liga vê ${NOVO}</p>
      <div style="display:grid;gap:9px">
        ${btn('📅 Mudar o dia e a hora')}
        ${btn('🤖 Trocar: com bots / sem bots')}
        ${btn('⚖️ Regras do ranking', '#fff', PURPLE)}
        ${btn('🗑️ Excluir a liga', '#fff', RED)}
      </div>
      <div style="height:12px"></div>
      ${btn('🔨 ABRIR O PREGÃO', GREEN, '#fff', 'font-size:17px')}
      <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.6);line-height:1.4;margin:8px 0 0">
        O host começa <b>quando quiser</b>, igual às salas de hoje — com 2 já dá.</p>
    </div>
  </div>`)

// ── 4 · arrumar um troféu ────────────────────────────────────────────────────
const p4 = `<div style="display:grid;grid-template-columns:1.05fr 1fr;gap:18px">
  ${caixa(`${rot('✏️ Arrumar a temporada 2')}
    <div style="display:grid;gap:10px">
      <div><p style="${OSW};font-size:13px;margin:0 0 4px">🏆 Campeão da liga</p>${campo('Skyy FC ▾', '100%')}</div>
      <div><p style="${OSW};font-size:13px;margin:0 0 4px">🏆🇧🇷 Campeão da Copa</p>${campo('Nata de SP ▾', '100%')}</div>
      <div style="display:flex;gap:10px">
        <div style="flex:1.3"><p style="${OSW};font-size:13px;margin:0 0 4px">⚽ Artilheiro</p>${campo('Romário ▾', '100%')}</div>
        <div style="flex:.7"><p style="${OSW};font-size:13px;margin:0 0 4px">Gols</p>${campo('31', '100%')}</div>
      </div>
      <div><p style="${OSW};font-size:13px;margin:0 0 4px">🔻 Rebaixados</p>${campo('Tôka10 ▾', '100%')}</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:13px">
      <div style="flex:1">${btn('Salvar', GREEN, '#fff')}</div>
      <div style="flex:.7">${btn('Cancelar')}</div>
      <div style="flex:.8">${btn('🗑️ Apagar', '#fff', RED)}</div>
    </div>`)}
  ${caixa(`${rot('O que conta nesta liga')}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.6);line-height:1.4;margin:0 0 10px">
      Toca pra ligar ou desligar. O que estiver desligado <b>some da sala de troféus e do ranking</b>.</p>
    <div style="display:flex;flex-wrap:wrap;gap:9px">
      ${chip('Título da liga', true)} ${chip('Copa', true)} ${chip('Rebaixamento', true)} ${chip('Artilheiro', true)} ${chip('Vice', false)} ${chip('Melhor ataque', false)}
    </div>
    <div style="height:3px;background:rgba(12,12,12,.1);margin:15px 0"></div>
    ${rot('Adicionar uma temporada que faltou')}
    <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.6);line-height:1.4;margin:0 0 9px">
      Deu ruim e uma temporada não foi gravada? O dono <b>escreve ela na mão</b> — a liga de vocês não fica com buraco.</p>
    ${btn('➕ Escrever uma temporada', '#fff', PURPLE)}`)}
</div>`

// ── 5 · as regras do ranking ─────────────────────────────────────────────────
const p5 = caixa(`
  <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap">
    <p style="${OSW};font-size:19px;margin:0">⚖️ Como o ranking desta liga conta ${NOVO}</p>
    <p style="font-size:12.5px;font-weight:700;color:${PURPLE};margin:0">O jogo sugere · quem decide é o dono</p>
  </div>
  <div style="height:3px;background:rgba(12,12,12,.1);margin:12px 0 15px"></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
    <div>
      ${rot('Jeito 1 · por ordem de títulos')}
      <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.6);line-height:1.4;margin:0 0 9px">
        Quem tem mais do <b>primeiro da lista</b> fica na frente. Empatou, olha o segundo, e assim vai.
        Arrasta pra escolher o que vale mais.</p>
      ${['1º · 🏆 Título da liga', '2º · 🏆🇧🇷 Copa', '3º · ⚽ Artilheiro'].map(t => `
        <div style="display:flex;align-items:center;justify-content:space-between;border:3px solid ${INK};border-radius:12px;background:#fff;
                    padding:9px 12px;margin-bottom:8px;box-shadow:2px 2px 0 ${INK};${OSW};font-size:14.5px">
          <span>${t}</span><span style="opacity:.35">⌃ ⌄</span></div>`).join('')}
    </div>
    <div>
      ${rot('Jeito 2 · por pontos que o dono escolhe')}
      <p style="font-size:12.5px;font-weight:600;color:rgba(12,12,12,.6);line-height:1.4;margin:0 0 9px">
        Cada coisa vale um tanto, e o rank soma. Aqui o dono muda os números como quiser — inclusive
        deixar a <b>Copa valer mais que a liga</b>.</p>
      ${[['🏆 Título da liga', '20'], ['🏆🇧🇷 Copa', '30'], ['⚽ Artilheiro', '5'], ['🔻 Rebaixamento', '−10']].map(([t, v]) => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;border:3px solid ${INK};border-radius:12px;background:#fff;
                    padding:7px 12px;margin-bottom:8px;box-shadow:2px 2px 0 ${INK}">
          <span style="${OSW};font-size:14.5px">${t}</span>
          <span style="border:2px solid ${INK};border-radius:8px;padding:2px 12px;${OSW};font-size:14px;background:${GOLD}">${v}</span></div>`).join('')}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:6px">
    ${caixa(`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div><p style="${OSW};font-size:14.5px;margin:0">🔻 Cair de divisão tira um título?</p>
          <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.55);margin:3px 0 0">Regra de resenha: quem cai, paga.</p></div>
        <div style="width:150px">${seg(['Não', 'Tira'], 1)}</div></div>`, '#F8F4E8')}
    ${caixa(`<p style="${OSW};font-size:14.5px;margin:0">📌 O que você escolher fica valendo</p>
      <p style="font-size:12px;font-weight:600;color:rgba(12,12,12,.6);line-height:1.4;margin:4px 0 0">
        Toda vez que a turma entrar na sala, o ranking aparece <b>do jeito que você deixou</b> — e dá pra mudar
        de novo quando quiser, sem perder troféu nenhum.</p>`, '#F8F4E8')}
  </div>`)

// ── 6 · o que muda / não muda ────────────────────────────────────────────────
const p6 = caixa(`
  <p style="${OSW};font-size:16px;margin:0 0 10px;text-transform:uppercase">O que muda — e o que NÃO muda</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;font-size:13.5px;font-weight:600;line-height:1.45">
    <p style="margin:0">✅ <b>Metade já existe.</b> A Liga Fechada e a trava do 👑 Lenda já estão no jogo, e a sala de troféus já guarda campeão, artilheiro e mico temporada a temporada.</p>
    <p style="margin:0">🆕 <b>O que entra:</b> marcar dia e hora, os troféus na espera, o ✏️ pra arrumar qualquer um, e as regras do ranking na mão do dono.</p>
    <p style="margin:0">🔒 <b>O motor não é tocado.</b> Mesmo leilão, mesma temporada, mesmo fim de jogo. A liga é uma sala normal com <b>um campo a mais</b>.</p>
    <p style="margin:0">🌍 <b>Sala comum não sente nada</b>, e o <b>ranking global do jogo também não</b>: as regras que o dono inventa valem só dentro da liga dele.</p>
    <p style="margin:0">🗓️ <b>É sempre a MESMA sala.</b> É isso que faz o troféu acumular.</p>
    <p style="margin:0">↩️ <b>Dá pra voltar atrás</b> por pedaço: cada peça é um commit isolado.</p>
  </div>
  <div style="height:3px;background:rgba(12,12,12,.1);margin:13px 0"></div>
  <p style="font-size:13px;font-weight:700;color:${RED};margin:0 0 6px">⚠️ Duas coisas que eu preciso falar na cara</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;font-size:13px;font-weight:600;line-height:1.45">
    <p style="margin:0"><b>Aviso na hora marcada não existe.</b> O jogo não manda notificação hoje. Marcar o horário serve pra combinar e pra sala não sumir — não pra chamar a galera.</p>
    <p style="margin:0"><b>Mexer no troféu dos outros dá briga.</b> Sugestão minha: cada correção fica com um <b>“arrumado pelo dono”</b> discreto do lado. Ninguém é acusado de nada, e todo mundo enxerga o que mudou.</p>
  </div>`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
body{margin:0;background:#F4ECD6;color:${INK};font-family:system-ui,-apple-system,sans-serif;width:1180px;padding:34px 32px 30px}
h1{${OSW};text-transform:uppercase;font-size:56px;line-height:.98;margin:14px 0 6px}
</style></head><body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};padding:6px 16px;
              ${OSW};font-size:14px;letter-spacing:1.2px;text-transform:uppercase">🏆 Mockup · liga fechada</div>
  <h1>A liga <span style="color:${RED}">é de vocês</span></h1>
  <p style="font-size:16px;font-weight:600;max-width:880px;margin:0 0 6px;line-height:1.45">
    Uma sala que <b>fica de pé</b>: marca o dia e a hora, só a sua turma entra, e os troféus vão se empilhando ali
    temporada após temporada. E o dono da liga <b>manda nela</b> — arruma um troféu que saiu errado e decide como
    o ranking conta. O jogo é o mesmo de sempre; muda a porta de entrada e quem escreve as regras.</p>

  ${h2(1, 'Criar a liga', 'ela é um MODO, do lado do Rápido')}
  ${p1}
  ${h2(2, 'Como ela aparece', 'quem não é da turma nem vê')}
  ${p2}
  ${h2(3, 'Dentro da sala', 'os troféus e os botões do dono')}
  ${p3}
  ${h2(4, 'Arrumar o que saiu errado', 'qualquer troféu, de qualquer um')}
  ${p4}
  ${h2(5, 'As regras são suas', 'o jogo sugere, você decide')}
  ${p5}
  <div style="height:26px"></div>
  ${p6}
  <p style="margin-top:18px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-liga-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
