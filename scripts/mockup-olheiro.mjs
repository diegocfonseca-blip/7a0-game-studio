// ─── 🕵️ MOCKUP: o OLHEIRO — sondar jogador de volta + Apoie a partir do Craque ──
// Pedido do Diego (07/09): *"na área de sondar quero dar opção agora pro usuário
// sondar jogador também… só quem for lenda consegue sondar lendas p baixo, e só
// quem for craque consegue ver jogadores craques p baixo, igual já funciona c
// overall… o nome disso será Olheiro… a aba que tava escrito sondar técnico
// agora diz sondar técnico e jogador… e o WhatsApp libere a partir do craque"*.
//
// Quatro telas de celular (390 de largura), do jeito que o código desenha:
//   1. a janelinha do clube pra quem é ⭐ CRAQUE (lenda trancada, com o porquê)
//   2. a mesma janelinha pra quem NÃO tem apoio (sonda o básico; craque/lenda trancados)
//   3. a aba Sondar com o rodapé novo "Sondar técnico e jogador"
//   4. o card ⭐ Craque do Apoie com o Olheiro em lista + grupo VIP + a tabela
//
//   node scripts/mockup-olheiro.mjs [--saida olheiro.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'olheiro.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', GREEN = '#1B7A3D'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const PRATA = 'linear-gradient(150deg,#F4F7FB,#CBD4DE 60%,#9BA7B5)'
const OURO = 'linear-gradient(150deg,#FFE79A,#FFC400 55%,#E8A200)'
const BEGE = 'linear-gradient(160deg,#DBD1B5,#CBBF9E 55%,#B2A583)'

// ── pedaços que o jogo já tem (copiados do visual real) ──
const escudo = (s = 30, cor = '#2F6BAE') => `<span style="display:inline-block;width:${s}px;height:${s}px;border-radius:${Math.round(s * .3)}px ${Math.round(s * .3)}px ${Math.round(s * .45)}px ${Math.round(s * .45)}px;background:${cor};border:2px solid ${INK};flex:none"></span>`
const cartaTecnico = () => `
  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:9px 10px;display:flex;align-items:center;gap:9px">
    <span style="font-size:26px">🧢</span>
    <div style="flex:1;min-width:0">
      <p style="${OSW};font-weight:900;font-size:13px;margin:0">Lisca Doido 🇧🇷</p>
      <p style="font-size:9.5px;font-weight:700;color:rgba(0,0,0,.5);margin:2px 0 0">categoria · nível · formações: <b>se revelam quando é seu</b></p>
    </div>
  </div>
  <p style="font-size:10px;font-weight:800;color:${GREEN};margin:6px 0 0;text-align:center">🆓 SEM contrato — pode sondar</p>
  <button style="width:100%;margin-top:9px;${OSW};font-weight:900;font-size:13px;text-transform:uppercase;background:${GOLD};color:${INK};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:10px 0">🕵️ Sondar pro leilão</button>`

const linha = (nome, estado, fame) => {
  // estado: livre | marcado | preso | lenda | teto
  const apagado = estado === 'preso' || estado === 'lenda' || estado === 'craque' || estado === 'teto'
  const bg = estado === 'preso' || estado === 'lenda' || estado === 'craque' ? '#eee' : estado === 'marcado' ? '#E9F9EF' : '#fff'
  const borda = estado === 'preso' || estado === 'lenda' || estado === 'craque' ? 'transparent' : GREEN
  const rot = estado === 'lenda' ? '🔒 lenda · só o 👑 Lenda sonda' : estado === 'craque' ? '🔒 craque · só o ⭐ Craque ou 👑 Lenda sonda' : estado === 'preso' ? `📝 falta${fame > 1 ? 'm' : ''} ${fame}` : estado === 'marcado' ? '✔ no leilão · tirar' : estado === 'teto' ? '🔒 já sondou 1' : '🆓 + sondar'
  return `<div style="display:flex;align-items:center;gap:6px;padding:4px 7px;border-radius:6px;background:${bg};border-left:3px solid ${borda};margin-bottom:3px;opacity:${apagado ? .5 : 1}">
    <span style="${OSW};font-weight:800;font-size:11.5px;color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nome}<span style="font-size:9.5px;margin-left:4px;font-weight:800;color:${apagado ? 'rgba(0,0,0,.45)' : GREEN}">${rot}</span></span></div>`
}
const posTit = t => `<p style="${OSW};font-weight:800;font-size:9px;text-transform:uppercase;color:${GREEN};opacity:.85;margin:6px 0 2px">${t}</p>`
const bastidor = txt => `<p style="font-size:9.5px;font-weight:700;color:#5a5647;background:#FFF7DB;border:2px dashed ${INK};border-radius:8px;padding:6px 8px;margin:0 0 5px;line-height:1.45">📰 <b>Bastidor:</b> ${txt}</p>`

const porta = (txt, mt = 11, fs = 11) => `<button style="width:100%;border:2.5px dashed ${INK};border-radius:11px;padding:8px 10px;margin:${mt}px 0 0;background:#FBF6E8;text-align:left;font-weight:800;font-size:${fs}px;color:rgba(0,0,0,.6);line-height:1.4;font-family:system-ui,sans-serif">${txt}</button>`

const caixaJogadores = (tier) => `
  <div style="border:3px dashed ${INK};border-radius:14px;padding:9px 10px;margin-top:11px;background:#FBF6E8">
    <p style="margin:0 0 5px;display:flex;align-items:center;gap:6px">
      <span style="${OSW};font-weight:900;font-size:9.5px;text-transform:uppercase;letter-spacing:.06em;color:${INK};background:${tier === 'ouro' ? OURO : tier === 'prata' ? PRATA : BEGE};border:2px solid ${INK};border-radius:999px;padding:2px 8px">${tier === 'ouro' ? '👑 Olheiro Lenda' : tier === 'prata' ? '⭐ Olheiro Craque' : '🕵️ Sondar básico'}</span>
      <span style="${OSW};font-weight:900;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#5a5647">Jogadores</span>
    </p>
    ${posTit('Goleiro')}
    ${linha('Rogério Ceni', tier === 'ouro' ? 'livre' : 'lenda')}
    ${posTit('Lateral')}
    ${linha('Cafu', tier === 'ouro' ? 'livre' : 'lenda')}
    ${linha('Alan Ruschel', 'preso', 2)}
    ${posTit('Zagueiro')}
    ${linha('Lúcio', 'marcado')}
    ${bastidor('Lúcio já avisou no vestiário: sem contrato novo, ele ouve proposta. O clube não gostou, mas vai brigar no pregão.')}
    ${linha('Naldo', 'teto')}
    ${posTit('Meia')}
    ${linha('Djalminha', tier === 'bege' ? 'craque' : 'teto')}
    ${linha('Zico', tier === 'ouro' ? 'teto' : 'lenda')}
    ${posTit('Atacante')}
    ${linha('Túlio Maravilha', tier === 'bege' ? 'craque' : 'preso', 4)}
    ${linha('Bruno Rangel', 'teto')}
    <p style="font-size:9px;font-weight:700;color:rgba(0,0,0,.5);margin:4px 2px 0;line-height:1.4">Marcar = ele entra no LEILÃO, no setor dele, junto com as outras cartas (máx. 1 por temporada, só 🆓 sem contrato, e o clube nunca fica manco). A grana da venda vai pro clube dono — que também pode brigar de volta.</p>
    ${tier === 'ouro' ? '' : `<button style="width:100%;border:2px dashed ${INK};border-radius:9px;padding:6px 9px;margin:7px 0 0;background:#fff;text-align:left;font-weight:800;font-size:10px;color:rgba(0,0,0,.6);line-height:1.4;font-family:system-ui,sans-serif">${tier === 'prata' ? '👑 As lendas deste clube só o <b>Olheiro Lenda</b> sonda — <u>toca aqui</u> pra virar Lenda pagando só a diferença' : '🕵️ Os trancados são do <b>Olheiro</b>: ⭐ Craque sonda os craques · 👑 Lenda sonda TUDO — <u>toca aqui</u>'}</button>`}
  </div>`

// ── a janelinha do clube (por cima da tela escurecida) ──
const janela = (miolo) => `
  <div style="position:absolute;inset:0;background:rgba(0,0,0,.72);padding:26px 14px 40px;overflow:hidden">
    <div style="max-width:430px;margin:0 auto;border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};background:${CREME};overflow:hidden">
      <div style="background:${INK};color:#fff;display:flex;align-items:center;gap:9px;padding:10px 12px">
        ${escudo(30)}
        <span style="${OSW};font-weight:900;font-size:14px;flex:1">⚔️ Bagres 1993</span>
        <span style="background:#fff;color:${INK};border-radius:8px;font-weight:900;font-size:13px;padding:2px 9px;${OSW}">✕</span>
      </div>
      <div style="padding:12px 12px 14px">${miolo}</div>
    </div>
  </div>`

// ── a aba Sondar por trás (fundo das telas 1 e 2, e a tela 3 inteira) ──
const clube = (nome, cor, rival, marca) => `
  <div style="border:3px solid ${INK};border-radius:14px;background:${rival ? '#FFF3C4' : '#fff'};box-shadow:2.5px 2.5px 0 ${INK};padding:11px 8px 9px;display:flex;flex-direction:column;align-items:center;gap:7px;position:relative">
    ${escudo(40, cor)}<span style="${OSW};font-weight:900;font-size:11.5px;text-align:center">${rival ? '⚔️ ' : ''}${nome}</span>${marca ? `<span style="position:absolute;top:5px;right:7px;font-size:13px">🕵️</span>` : ''}
  </div>`
const abaSondar = (texto) => `
  <div style="background:${INK};border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:12px;color:#fff;margin-bottom:12px"><span style="${OSW};font-weight:900;font-size:15px">🕵️ SONDAR PRO LEILÃO · TEMP. 4</span></div>
  <div style="background:#fff;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:11px 12px;margin-bottom:10px">
    <p style="font-weight:900;font-size:12.5px;${OSW};margin:0 0 8px">🧢 Seu técnico</p>
    <div style="border:3px dashed ${INK};border-radius:14px;background:#FBF6E8;padding:10px 12px">
      <p style="font-weight:900;font-size:12px;${OSW};margin:0">Você ainda não tem técnico</p>
      <p style="font-size:10px;font-weight:700;color:#5a5647;margin:3px 0 0;line-height:1.4">Os clubes da Série A têm — sonda um aqui embaixo e brigue por ele no próximo leilão.</p>
    </div>
  </div>
  <div style="background:#FFF7DB;border:3px solid ${INK};border-radius:14px;box-shadow:3px 3px 0 ${INK};padding:11px;margin-bottom:10px">
    <p style="font-weight:900;font-size:12.5px;${OSW};margin:0 0 2px">🕵️ Sondar · Série A</p>
    <p style="font-size:10.5px;font-weight:700;color:#5a5647;margin:0;line-height:1.45">${texto}</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    ${clube('Bagres 1993', '#084C2C', true, true)}${clube('Vidraceiro FC', '#2186D9', false, false)}
    ${clube('Nata de SP', '#C2452F', true, false)}${clube('Manfré FC', '#7C3AED', false, false)}
    ${clube('Tôka10', '#0C0C0C', false, false)}${clube('Skyy FC', '#2F6BAE', false, false)}
  </div>`
const TXT_CRAQUE = `Toque num clube e marque quem você quer — <b>máx. 1 técnico e 1 jogador por temporada</b>, e só quem está <b>🆓 sem contrato</b>. É igual listar pra venda, só que ao contrário: <b>o sondado vai pro leilão</b> — o jogador entra no setor dele (e nesse você PODE dar lance) e o técnico abre o pregão como uma posição a mais, antes dos goleiros. Seu <b>⭐ Olheiro Craque</b> sonda <b>de craque pra baixo</b> — lenda, só o 👑 Lenda.`
const TXT_SEM = `Toque num clube e marque quem você quer — <b>máx. 1 técnico e 1 jogador por temporada</b>, e só quem está <b>🆓 sem contrato</b>. É igual listar pra venda, só que ao contrário: <b>o sondado vai pro leilão</b> — o jogador entra no setor dele (e nesse você PODE dar lance) e o técnico abre o pregão como uma posição a mais, antes dos goleiros. Você sonda <b>foi profissional, bom jogador e promessa</b> — craque é do 🕵️ <b>Olheiro</b> ⭐ Craque, e lenda só do 👑 Lenda.`

const rodape = () => `
  <div style="position:absolute;left:0;right:0;bottom:0">
    <div style="background:linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200);border-top:3px solid ${INK};border-bottom:3px solid ${INK};padding:6px 10px;text-align:center;${OSW};font-weight:900;font-size:10.5px;text-transform:uppercase;letter-spacing:.3px">👇 tem técnico e jogador pra sondar aqui embaixo</div>
    <div style="background:#FAF7EE;display:flex;gap:7px;padding:8px 9px 12px">
      <div style="flex:1;background:#fff;border:3px solid ${INK};border-radius:12px;box-shadow:2px 2px 0 ${INK};padding:5px 2px;text-align:center"><span style="display:block;font-size:18px;line-height:22px">📋</span><span style="display:block;${OSW};font-weight:900;font-size:10px;text-transform:uppercase;margin-top:1px">Vender</span></div>
      <div style="flex:1.25;position:relative;background:linear-gradient(150deg,#FFE79A,${GOLD} 55%,#E8A200);border:3px solid ${INK};border-radius:12px;box-shadow:2px 2px 0 ${INK};padding:5px 2px;text-align:center">
        <span style="position:absolute;top:-8px;right:-4px;background:#C2452F;color:#fff;font-size:8px;font-weight:900;border:2px solid ${INK};border-radius:999px;padding:1px 6px;letter-spacing:.3px">NOVO</span>
        <span style="display:block;font-size:18px;line-height:22px">🕵️</span><span style="display:block;${OSW};font-weight:900;font-size:10px;text-transform:uppercase;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Sondar técnico e jogador (1)</span></div>
    </div>
  </div>`

// ── o card ⭐ Craque do Apoie (o trecho que mudou) + a tabela ──
const ben = (t, txt) => `<p style="font-size:11.5px;font-weight:700;line-height:1.35;margin:8px 0 0"><b style="font-weight:900">${t}:</b> <span style="color:rgba(0,0,0,.75)">${txt}</span></p>`
const item = (txt, mt = 4) => `<p style="font-size:11px;font-weight:700;color:rgba(0,0,0,.75);line-height:1.35;margin:${mt}px 0 0;padding-left:12px">${txt}</p>`
const linhaOv = (pos, nome, clube, chip) => `<div style="border:2px solid ${INK};border-radius:8px;background:#fff;padding:8px 10px;margin-top:6px;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:900"><span style="font-size:9px;color:rgba(0,0,0,.45);${OSW}">${pos}</span><span>${nome}</span><span style="font-size:8.5px;font-weight:700;color:rgba(0,0,0,.4)">· ${clube}</span><span style="margin-left:auto">${chip}</span></div>`
const chipOv = (g, v) => `<span style="${OSW};font-size:9.5px;border:1.5px solid ${INK};border-radius:6px;padding:0 5px;background:${g};line-height:13px">${v}</span>`
const chipSondar = `<span style="${OSW};font-size:9px;font-weight:900;border:2px solid ${INK};border-radius:6px;padding:2px 6px;background:${GREEN};color:#fff">🕵️ SONDAR</span>`
const apoie = () => `
  <div style="border:3px solid ${INK};border-radius:16px;box-shadow:4px 4px 0 ${INK};overflow:hidden;background:#fff">
    <div style="background:${PRATA};padding:10px 12px;display:flex;justify-content:space-between;align-items:baseline;border-bottom:3px solid ${INK}">
      <span style="${OSW};font-weight:900;font-size:17px;text-transform:uppercase">⭐ Craque</span><span style="${OSW};font-weight:900;font-size:14px">R$ 19,90 <span style="font-size:9px;font-weight:700;opacity:.65">pagamento único</span></span>
    </div>
    <div style="padding:8px 12px 12px">
      <p style="font-size:11px;font-weight:700;color:rgba(0,0,0,.65);margin:0;line-height:1.4">Pra quem quer dar um up no visual, <b>controlar o tempo</b>, ter o <b>🕵️ Olheiro</b> (nível dos jogadores + sondar jogador) e entrar no <b>grupo VIP</b>.</p>
      <p style="font-size:9.5px;font-weight:800;color:rgba(0,0,0,.35);margin:8px 0 0;text-align:center">… visual prata · modo manual (igual estava) …</p>
      ${ben('🕵️ Olheiro Craque', 'seu olheiro trabalha <b>de Craque pra baixo</b> (Craque, Promessa, Bom Jogador e Profissional — a Lenda fica em mistério, só o 👑 revela):')}
      ${item('① <b>Nível (overall) revelado</b> no seu elenco, <b>depois de contratar</b> no leilão — no modo padrão ele vem oculto.')}
      ${item('② <b>Sondar os CRAQUES</b> de outros clubes na janela antes do leilão: o sondado <b>vai pro pregão</b> e você briga por ele — 1 por leilão, igual ao técnico. <i>(Sem apoio já dá pra sondar profissional, bom jogador e promessa; o Craque destrava os craques.)</i>', 2)}
      ${linhaOv('MEI', 'Djalminha', 'Palmeiras ⭐', chipOv('linear-gradient(150deg,#F4F7FB,#CBD4DE)', '83–88'))}
      ${linhaOv('ATA', 'Túlio Maravilha', 'Botafogo ⭐', chipSondar)}
      ${ben('📲 Grupo VIP no WhatsApp', 'contato direto com o criador (Diego) pra ver bastidores, novidades antes de todo mundo e achar galera pra jogar online.')}
      <div style="border:3px solid ${INK};border-radius:12px;overflow:hidden;margin-top:6px;box-shadow:2px 2px 0 ${INK}"><div style="background:${CREME};padding:8px"><p style="background:#fff;border:2px solid ${INK};border-radius:8px;padding:4px 8px;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.8);margin:0">👑 <b style="${OSW}">Diego (criador):</b> sala aberta AGORA, código 7GK2 — quem vem? 🔨</p></div></div>
      ${ben('💾 4 Saves (Carreiras Salvas)', 'quantidade de carreiras que você pode ter salvas ao mesmo tempo.')}
    </div>
  </div>
  <div style="border:3px solid ${INK};border-radius:12px;overflow:hidden;margin-top:14px;box-shadow:4px 4px 0 ${INK};background:#fff">
    <p style="${OSW};font-weight:900;font-size:13px;text-transform:uppercase;padding:8px 12px;margin:0;background:${INK};color:#fff">📊 O que vem em cada um</p>
    <table style="width:100%;border-collapse:collapse;font-size:9.5px;font-weight:900">
      <tr>${['&nbsp;', '🎫 Sócio', '⭐ Craque', '👑 Lenda', '🖋️ Batismo'].map((h, i) => `<th style="padding:6px ${i ? 3 : 8}px;text-align:${i ? 'center' : 'left'};background:${CREME};border-bottom:2.5px solid ${INK};${OSW};font-size:9px;text-transform:uppercase">${h}</th>`).join('')}</tr>
      ${[['Modo Manual (ritmo)', '—', '✓', '✓', '✓'], ['🕵️ Olheiro (nível + sondar)', 'básico', 'até craque', 'até lendas', 'até lendas'], ['Carreiras salvas', '2', '4', '6', '6'], ['Grupo VIP no zap', '—', '✓', '✓', '✓'], ['Carreira Online e Ligas', '—', '—', '✓', '✓']]
        .map((r, i) => `<tr style="background:${i % 2 ? '#FBF6E9' : '#fff'}">${r.map((v, j) => `<td style="padding:6px ${j ? 3 : 8}px;text-align:${j ? 'center' : 'left'};border-top:1px solid rgba(0,0,0,.08);font-size:${j ? 9.5 : 10}px;color:${v === '—' ? 'rgba(0,0,0,.25)' : v === '✓' ? GREEN : INK}">${v}</td>`).join('')}</tr>`).join('')}
    </table>
  </div>`

// ── montagem ──
const tela = (titulo, corpo, sub) => `
  <div style="width:390px;flex:none">
    <p style="${OSW};font-weight:900;font-size:13px;text-transform:uppercase;margin:0 0 6px;color:${INK}">${titulo}</p>
    <div style="width:390px;height:844px;background:${CREME};border:3px solid ${INK};border-radius:22px;box-shadow:4px 4px 0 ${INK};overflow:hidden;position:relative;padding:16px 14px">${corpo}</div>
    <p style="font-size:11px;font-weight:700;color:#5a5647;margin:8px 2px 0;line-height:1.4">${sub}</p>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}*{box-sizing:border-box}body{margin:0;background:#e9e2cf;font-family:system-ui,sans-serif;color:${INK};padding:22px}h1{${OSW};font-weight:900;font-size:22px;text-transform:uppercase;margin:0 0 14px}</style>
<h1>🕵️ O Olheiro — sondar jogador de volta · WhatsApp a partir do Craque</h1>
<div style="display:flex;gap:22px;align-items:flex-start">
  ${tela('1 · janelinha do clube · quem é ⭐ Craque', abaSondar(TXT_CRAQUE) + rodape() + janela(cartaTecnico() + caixaJogadores('prata')), 'Técnico como já era, e embaixo a caixa de <b>jogadores</b> com o selo do Olheiro. Craque sonda de craque pra baixo; as <b>lendas aparecem trancadas</b> com o porquê (Rogério Ceni, Cafu, Zico) e uma porta pra virar Lenda. 1 jogador por leilão — depois de marcar o Lúcio, o resto fica "já sondou 1".')}
  ${tela('2 · janelinha do clube · quem NÃO tem apoio', abaSondar(TXT_SEM) + rodape() + janela(cartaTecnico() + caixaJogadores('bege')), 'Sem apoio a lista aparece igual, com o selo bege "Sondar básico": dá pra sondar <b>foi profissional, bom jogador e promessa</b>. <b>Craque</b> (Djalminha, Túlio) fica trancado pro ⭐, <b>lenda</b> pro 👑 — sempre com o porquê escrito, e a porta no pé.')}
  ${tela('3 · a aba Sondar com o rodapé novo', abaSondar(TXT_CRAQUE) + rodape(), 'A faixa dourada e a aba do rodapé agora dizem <b>"Sondar técnico e jogador"</b>. O texto de cima explica a régua do Olheiro da conta (esta é a versão do ⭐ Craque; o 👑 Lenda lê "sonda qualquer jogador, lenda inclusive").')}
  ${tela('4 · Apoie · card ⭐ Craque e a tabela', apoie(), 'O benefício ganhou nome: <b>🕵️ Olheiro Craque</b>, em lista (① nível · ② sondar os craques — o básico é de graça), com o exemplo do Túlio pra sondar. O <b>📲 Grupo VIP</b> desceu do Lenda pro Craque. No Lenda vira "Olheiro Lenda: tudo, lenda inclusive" (Romário 93–99 + Zico pra sondar). A tabela mostra os dois.')}
</div>`

writeFileSync('/tmp/mockup-olheiro.html', html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pg = await b.newPage({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2 })
await pg.goto('file:///tmp/mockup-olheiro.html'); await pg.waitForTimeout(400)
await pg.screenshot({ path: SAIDA, fullPage: true }); await b.close()
console.log('✅', SAIDA)
