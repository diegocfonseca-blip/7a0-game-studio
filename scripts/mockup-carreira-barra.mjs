// ─── 🪜 MOCKUP: A BARRA DE BAIXO NA CARREIRA ────────────────────────────────
//
// Pergunta do Diego (21/08), depois de aprovar a barra da home: *"ficou ótimo a
// aba no rodapé da home… como seria o mockup se também fizermos igual no modo
// carreira? Com botões de jogos, tabela, elenco e etc. Ficaria embaixo e em cima
// e etc? Qual a ideia?"*
//
// 🔎 COMO ESTÁ HOJE (medido no código, pyramidseason.tsx:5617):
// as 5 abas JÁ EXISTEM — Jogos · Tabelas · Elenco · Rank · Clube — mas são
// pílulas NO MEIO DA PÁGINA. Elas rolam junto com o conteúdo e somem. Quem está
// no fim do Elenco (22 jogadores) precisa rolar tudo de volta pra ver os Jogos.
// E o cabeçalho preto (temporada, posição, caixa) some junto.
//
// 💡 A IDEIA, e a resposta pro "embaixo e em cima":
//   · EMBAIXO fica a NAVEGAÇÃO (as 5 abas) — é o que a mão alcança sem pensar;
//   · EM CIMA fica o CONTEXTO que não pode sumir (que temporada, que rodada, que
//     posição, quanto tem no caixa) — mas ENCOLHIDO numa faixa fina que gruda.
// Assim, role até onde rolar, a pessoa sempre sabe ONDE ESTÁ e vai PRA QUALQUER
// LUGAR — que é exatamente o que a barra da home resolveu.
//
//   node scripts/mockup-carreira-barra.mjs [--saida x.png]
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const SAIDA = arg('--saida', 'carreira-barra.png')
const b64 = w => readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')

const INK = '#0C0C0C', GOLD = '#FFC400', GREEN = '#1B7A3D', RED = '#C2452F', PURPLE = '#7C3AED'
const OSW = 'font-family:Oswald,sans-serif;font-weight:700'
const CREME = '#F4ECD6'

const fone = (inner, rot, cor, nota) => `
<div style="flex:0 0 372px">
  <div style="${OSW};font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:${cor}">${rot}</div>
  <div style="font-family:system-ui;font-weight:600;font-size:11.5px;color:rgba(12,12,12,.5);margin:3px 0 9px">${nota}</div>
  <div style="width:372px;border:5px solid ${INK};border-radius:26px;background:${CREME};box-shadow:6px 6px 0 ${INK};overflow:hidden">${inner}</div>
</div>`

// ── ícones desenhados (mesmo estilo da barra da home) ───────────────────────
const ico = (nome, cor) => {
  const fill = cor.startsWith('#7C') ? 'rgba(124,58,237,.22)' : 'rgba(12,12,12,.10)'
  const p = `fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`
  const d = {
    jogos: `<rect x="3.5" y="5" width="17" height="15.5" rx="2.4" ${p} fill="${fill}"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" ${p}/><circle cx="12" cy="15" r="2.4" ${p}/>`,
    tabelas: `<rect x="3.5" y="4" width="17" height="16" rx="2.4" ${p} fill="${fill}"/><path d="M3.5 9h17M3.5 14.5h17M9 4v16" ${p}/>`,
    elenco: `<path d="M12 3.5l7 2.6v5.3c0 4.3-3 7.6-7 9.1-4-1.5-7-4.8-7-9.1V6.1z" ${p} fill="${fill}"/><path d="M9.2 12.3l1.9 1.9 3.7-3.9" ${p}/>`,
    rank: `<path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" ${p} fill="${fill}"/><path d="M7 5.2H4.3v1.6A3.2 3.2 0 0 0 7 9.9M17 5.2h2.7v1.6A3.2 3.2 0 0 1 17 9.9M12 13.7v3.1M8.6 20.5h6.8" ${p}/>`,
    clube: `<path d="M4 20.5V10l8-5.5 8 5.5v10.5z" ${p} fill="${fill}"/><path d="M8.5 20.5v-4.6h7v4.6M8.5 12.4h7" ${p}/>`,
  }[nome]
  return `<svg width="25" height="25" viewBox="0 0 24 24" style="display:block;margin:0 auto">${d}</svg>`
}

const barra = (ativa, comPonto) => `
  <div style="position:sticky;bottom:0;background:rgba(250,247,238,.97);border-top:1.5px solid rgba(12,12,12,.13);
    display:flex;gap:2;padding:6px 6px 8px;box-shadow:0 -2px 12px rgba(0,0,0,.05)">
    ${[['jogos', 'Jogos'], ['tabelas', 'Tabelas'], ['elenco', 'Elenco'], ['rank', 'Rank'], ['clube', 'Clube']]
      .map(([k, t]) => {
        const on = k === ativa
        const cor = on ? PURPLE : 'rgba(12,12,12,.55)'
        return `<div style="flex:1;text-align:center;padding:5px 0;position:relative">
          ${ico(k, cor)}
          <div style="${OSW};font-size:10.5px;margin-top:3px;color:${on ? PURPLE : 'rgba(12,12,12,.6)'}">${t}</div>
          ${comPonto && k === 'jogos' ? `<span style="position:absolute;top:3px;right:26%;width:9px;height:9px;border-radius:99px;background:${RED};border:2px solid ${CREME}"></span>` : ''}
        </div>`
      }).join('')}
  </div>`

// ── 🔴 COMO ESTÁ HOJE ───────────────────────────────────────────────────────
const pilula = (ic, t, on) => `<div style="flex:1;border:2.5px solid ${INK};border-radius:11px;padding:6px 2px;text-align:center;
  background:${on ? '#6C43C0' : '#fff'};color:${on ? '#fff' : INK};box-shadow:2px 2px 0 ${INK}">
  <div style="font-size:13px">${ic}</div><div style="${OSW};font-size:9px;text-transform:uppercase">${t}</div></div>`

const hoje = `
<div style="padding:12px 12px 16px">
  <div style="background:${INK};border-radius:14px;padding:11px 12px;color:#fff;margin-bottom:9px">
    <div style="font-size:8.5px;font-weight:800;letter-spacing:1.4px;color:${GOLD}">TEMPORADA 12 · ⚽ LIGA LEGENDS</div>
    <div style="${OSW};font-size:17px;margin-top:2px">Rodada <b style="font-size:20px">5</b><span style="font-size:11px;opacity:.5"> / 38</span></div>
    <div style="font-size:8.5px;font-weight:700;color:rgba(255,255,255,.65);margin-top:3px">Série A</div>
    <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:-32px">
      <span style="${OSW};font-size:11px;border:2px solid rgba(255,255,255,.25);border-radius:99px;padding:2px 8px">🏅 3º</span>
      <span style="${OSW};font-size:11px;background:${GOLD};color:${INK};border:2px solid ${INK};border-radius:99px;padding:2px 8px">💰 412</span>
    </div>
  </div>
  <div style="display:flex;gap:5px;margin-bottom:10px">
    ${pilula('🗓️', 'Jogos', true)}${pilula('📊', 'Tabelas')}${pilula('👥', 'Elenco')}${pilula('🏆', 'Rank')}${pilula('🏟️', 'Clube')}
  </div>
  <div style="border:3px solid ${INK};border-radius:14px;background:#fff;padding:10px;box-shadow:3px 3px 0 ${INK};margin-bottom:8px">
    <div style="${OSW};font-size:12px">⚽ Seu jogo · 2 × 1</div>
    <div style="font-family:system-ui;font-size:10px;font-weight:600;color:rgba(12,12,12,.55);margin-top:2px">Neymarzetti × Goiaba FC</div>
  </div>
  ${[1, 2, 3, 4, 5, 6].map(() => `<div style="border:2.5px solid rgba(12,12,12,.25);border-radius:11px;background:#fff;padding:11px;margin-bottom:6px"></div>`).join('')}
  <div style="position:relative;border:2px dashed ${RED};border-radius:12px;padding:9px;margin-top:4px">
    <div style="position:absolute;top:-9px;left:8px;background:${RED};color:#fff;${OSW};font-size:9px;padding:1px 7px;border-radius:5px">VOCÊ ESTÁ AQUI</div>
    <div style="font-family:system-ui;font-weight:700;font-size:10.5px;color:${RED};line-height:1.35;margin-top:3px">
      Rolou até aqui pra ver o elenco. As <b>abas ficaram lá em cima</b>, junto com a temporada, a posição e o caixa —
      pra trocar de aba tem que <b>rolar tudo de volta</b>.</div>
  </div>
</div>`

// ── 🟢 A PROPOSTA ───────────────────────────────────────────────────────────
const proposta = `
<div>
  <!-- faixa fina que GRUDA no topo -->
  <div style="position:sticky;top:0;background:${INK};color:#fff;padding:8px 12px;display:flex;align-items:center;gap:8px;
    border-bottom:2px solid rgba(255,255,255,.12);box-shadow:0 3px 10px rgba(0,0,0,.18)">
    <div style="min-width:0;flex:1">
      <div style="${OSW};font-size:12.5px;line-height:1.05">T12 · Rodada 5<span style="opacity:.45;font-size:10px"> / 38</span></div>
      <div style="font-size:8.5px;font-weight:700;color:rgba(255,255,255,.6)">Neymarzetti · Série A</div>
    </div>
    <span style="${OSW};font-size:11px;border:2px solid rgba(255,255,255,.25);border-radius:99px;padding:2px 8px">🏅 3º</span>
    <span style="${OSW};font-size:11px;background:${GOLD};color:${INK};border:2px solid ${INK};border-radius:99px;padding:2px 8px">💰 412</span>
  </div>
  <div style="padding:11px 12px 6px">
    ${[['👤 Neymar', 'ATA · ⭐⭐⭐⭐⭐'], ['👤 Zico', 'MEI · ⭐⭐⭐⭐⭐'], ['👤 Cafu', 'LAT · ⭐⭐⭐⭐'], ['👤 Dida', 'GOL · ⭐⭐⭐⭐'], ['👤 Obina', 'ATA · ⭐⭐'], ['👤 Vampeta', 'MEI · ⭐⭐⭐']]
      .map(([n, s]) => `<div style="display:flex;align-items:center;justify-content:space-between;border:2.5px solid ${INK};
        border-radius:11px;background:#fff;padding:8px 11px;margin-bottom:6px;box-shadow:2px 2px 0 ${INK}">
        <span style="${OSW};font-size:12.5px">${n}</span>
        <span style="font-family:system-ui;font-weight:700;font-size:9.5px;color:rgba(12,12,12,.5)">${s}</span></div>`).join('')}
    <div style="border:2px dashed ${GREEN};border-radius:12px;padding:9px;margin-top:6px;position:relative">
      <div style="position:absolute;top:-9px;left:8px;background:${GREEN};color:#fff;${OSW};font-size:9px;padding:1px 7px;border-radius:5px">VOCÊ ESTÁ AQUI</div>
      <div style="font-family:system-ui;font-weight:700;font-size:10.5px;color:#14683A;line-height:1.35;margin-top:3px">
        Mesmo lugar da outra tela — mas aqui você <b>ainda vê</b> a rodada, a posição e o caixa lá em cima,
        e troca de aba <b>sem rolar nada</b>.</div>
    </div>
  </div>
  ${barra('elenco', true)}
</div>`

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}body{margin:0;background:#EDE3C9;color:${INK};font-family:system-ui,-apple-system,sans-serif;padding:32px 30px}</style></head><body>
  <div style="display:inline-block;background:${GOLD};border:3px solid ${INK};border-radius:999px;box-shadow:3px 3px 0 ${INK};
    padding:5px 15px;${OSW};font-size:12.5px;letter-spacing:.08em">🪜 MOCKUP · BARRA NA CARREIRA</div>
  <h1 style="${OSW};text-transform:uppercase;font-size:44px;margin:14px 0 6px;line-height:1">
    EMBAIXO A <span style="color:${PURPLE}">NAVEGAÇÃO</span>, EM CIMA O <span style="color:${RED}">PLACAR</span></h1>
  <p style="font-size:15px;font-weight:600;max-width:1000px;line-height:1.5;margin:0 0 26px">
    As 5 abas <b>já existem</b> na carreira — só que como pílulas no meio da página, que <b>rolam e somem</b>.
    A proposta é a mesma da home: <b>navegação embaixo</b> (onde a mão alcança) e, em cima, uma <b>faixa fina que gruda</b>
    com o que não pode sumir de vista — rodada, posição e caixa.</p>

  <div style="display:flex;gap:40px;align-items:flex-start">
    ${fone(hoje, '🔴 Como está hoje', RED, 'as abas rolam junto e ficam pra trás')}
    ${fone(proposta, '🟢 A proposta', GREEN, 'faixa fina em cima · abas coladas embaixo')}
    <div style="flex:1;min-width:300px;max-width:470px">
      <div style="border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:17px;text-transform:uppercase;margin-bottom:11px">Respondendo o "embaixo e em cima"</div>
        ${[['⬇️ Embaixo: pra ONDE ir', 'As 5 abas que já existem, coladas na tela. Trocar de Elenco pra Jogos vira <b>um toque</b>, de qualquer ponto da página — hoje é rolar a página inteira de volta.'],
           ['⬆️ Em cima: ONDE você está', 'O cabeçalho preto de hoje é grande e some ao rolar. Vira uma <b>faixa fina que gruda</b>: temporada, rodada, posição e caixa. É a informação que você consulta o tempo todo enquanto mexe no time.'],
           ['🔴 O pontinho no Jogos', 'Quando a rodada está <b>rolando</b>, o Jogos ganha um ponto vermelho. Você pode estar vendo o elenco e sabe na hora que a bola está em campo — sem perder o momento.']]
          .map(([t, d]) => `<div style="display:flex;gap:9px;align-items:flex-start;margin-bottom:11px">
            <span style="color:${GREEN};${OSW};font-size:15px;line-height:1.1">✓</span>
            <p style="font-size:12.5px;font-weight:600;line-height:1.45;margin:0"><b style="${OSW};text-transform:uppercase;font-size:13px">${t}</b><br>${d}</p></div>`).join('')}
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#F6FBF7;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">Por que na carreira vale MAIS que na home</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          Na home a pessoa entra, escolhe e sai. Na <b>carreira ela FICA</b> — são 38 rodadas, 22 jogadores, tabela,
          ranking e o clube inteiro, tudo em telas compridas.<br><br>
          É exatamente onde "rolar de volta pra trocar de aba" mais cansa. E é o modo que você quer empurrar:
          <b>118 mil temporadas jogadas</b>, gente na 180ª.</p>
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#FFF6D6;box-shadow:4px 4px 0 ${INK};padding:16px 18px;margin-bottom:16px">
        <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">⚠️ O cuidado que eu tomaria</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          A carreira tem <b>momento sagrado</b>: a partida rolando, o pênalti, a festa de campeão. A barra <b>some</b>
          nessas horas — nada pode disputar a tela com o jogo.<br><br>
          E o <b>desenho do estádio</b> continua sendo a primeira coisa ao abrir o Clube. Isso não muda.</p>
      </div>

      <div style="border:4px solid ${INK};border-radius:18px;background:#F1EDE0;box-shadow:4px 4px 0 ${INK};padding:16px 18px">
        <div style="${OSW};font-size:16px;text-transform:uppercase;margin-bottom:9px">🛡️ O que NÃO muda</div>
        <p style="font-size:12.5px;font-weight:600;line-height:1.5;margin:0">
          As abas são <b>as mesmas 5</b> que já existem — nenhuma nova, nenhuma sai. O conteúdo de cada uma fica
          igual. Muda <b>onde</b> os botões ficam e o <b>tamanho</b> do cabeçalho. O motor não é tocado.</p>
      </div>
    </div>
  </div>
  <p style="margin-top:26px;${OSW};font-size:15px">⚽ Leilão <span style="color:${RED}">Legends</span>
    <span style="float:right;font-weight:700;font-size:12px;opacity:.45">leilaolegends.com</span></p>
</body></html>`

const tmp = `/tmp/mockup-carr-${process.pid}.html`
writeFileSync(tmp, html)
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 })
await p.goto('file://' + tmp)
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(600)
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
