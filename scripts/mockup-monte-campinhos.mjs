// 🪣 MOCKUP — ver o campinho de TODO MUNDO no Monte Final (ideia do Diego, 15/09)
//
// Palavras dele: *"quando você tá no monte e tá escolhendo os times… não poderia
// aparecer o campinho de todos os times, igual quando acontece a simulação? Até pra
// gente saber o quê: como já tem um botão de gerenciar, se eu ver que tem um campinho
// com um monte de buraco, pode ser que esse cara já saiu do jogo. Aí é mais fácil eu
// apertar em gerenciar e tirar ele"*. E ele mesmo levantou o risco: *"vai prejudicar
// alguma coisa ou não? Digo isso porque pode ser que tenha até 20 campinhos"*.
//
// ✅ CONFERIDO NO CÓDIGO antes de desenhar (regra dele: nada de achismo):
//   · o tempo da vez é **15 s** — `MONTE_MS = 15_000` em `store.tsx`. O "13s" que ele
//     viu na live era o relógio JÁ CORRENDO (a tela mostra `remaining`);
//   · a sala vai a **20 técnicos** (`MAX_PLAYERS` em `lobby.tsx`; 40 em duplas);
//   · hoje o Monte desenha **só o seu** campinho (`<YourPitch />` em `screens.tsx`);
//   · cada campinho desenha **11 rostos** (`avatarIdentity` no `Campinho`);
//   · e a tela do Monte **re-renderiza 4× por segundo** enquanto o relógio corre
//     (`setInterval(…, 250)`).
//
// 🚫 E ELE CORTOU A MARCAÇÃO DE QUEM SAIU: *"não precisa colocar quem saiu, deixa quieto
// como está hoje. O cara que é o host, ele decide se tira"*. O jogo SABE quem saiu
// (`state.presenceUids`), mas mostrar isso na tela não é o que ele quer — a decisão de
// remover continua sendo de gente, sem carimbo do jogo em cima de ninguém.
//
// Rodar: node scripts/mockup-monte-campinhos.mjs [--saida /tmp/x.png]
import { chromium } from 'playwright-core'
import { FONTES, OSW, INK, CREME, GOLD } from './loja-pecas.mjs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/mockup-monte-campinhos.png')
const ROXO = '#7C3AED'

// ── um campinho de mentirinha (só a silhueta, pro mockup) ──────────────────
const campinho = (buracos, alt = 150) => {
  const linhas = [[3, 'ATA'], [3, 'MEI'], [4, 'ZAG'], [1, 'GOL']]
  let faltam = buracos
  return `<div style="border:3px solid ${INK};border-radius:12px;overflow:hidden;background:
      repeating-linear-gradient(90deg,#2E9E5B 0 26px,#2B9354 26px 52px);padding:7px 6px;height:${alt}px;
      display:flex;flex-direction:column;justify-content:space-around">
    ${linhas.map(([n]) => `<div style="display:flex;justify-content:space-around">
      ${Array.from({ length: n }, () => {
        const vazio = faltam-- > 0
        return `<div style="width:22px;height:22px;border:2.5px solid ${INK};border-radius:999px;
          background:${vazio ? 'rgba(0,0,0,.28)' : GOLD};display:flex;align-items:center;justify-content:center;
          font-size:11px">${vazio ? '' : '🙂'}</div>`
      }).join('')}
    </div>`).join('')}
  </div>`
}

const TIMES = [
  { n: 'Meia na Canela', b: 0, voce: true },
  { n: 'Migxz', b: 2 },
  { n: 'Berretinho FC', b: 1 },
  { n: 'Dv_777', b: 7 },
  { n: 'Tricolor do Arruda', b: 3 },
  { n: 'Papão da Curva', b: 6 },
]

// a fileira do ⚙️ gerenciar técnicos, com os buracos
const linhaGerenciar = (nome, buracos, bot) => `
  <div style="display:flex;align-items:center;gap:8px;padding:3px 2px">
    <span style="${OSW};font-weight:700;font-size:12px;color:rgba(12,12,12,.7);flex:1;min-width:0;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bot ? '🤖 ' : ''}${nome}</span>
    <span style="${OSW};font-weight:700;font-size:11px;white-space:nowrap;
      color:${buracos > 0 ? '#B23A2A' : 'rgba(0,0,0,.3)'}">${buracos > 0 ? `−${buracos} 🕳️` : '✅'}</span>
    <span style="border:1px solid rgba(0,0,0,.2);border-radius:8px;padding:3px 8px;background:${CREME};
      color:#B23A2A;${OSW};font-weight:700;font-size:11px">remover</span>
  </div>`

// o topo da tela do Monte, igual ao de hoje
const topoMonte = `
  <div style="${OSW};font-weight:700;font-size:22px;text-transform:uppercase">🪣 Monte Final</div>
  <div style="${OSW};font-weight:400;font-size:10.5px;opacity:.7;margin-top:2px">As sobras do pregão. Quem tem mais buracos escolhe primeiro, em serpente.</div>
  <div style="border:3px solid ${INK};border-radius:12px;background:#fff;box-shadow:3px 3px 0 ${INK};
    padding:9px;text-align:center;margin:9px 0;${OSW};font-weight:700;font-size:13px">Vez de <b>Migxz</b> · 13s…</div>`

const html = `<!doctype html><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box} body{margin:0;background:${CREME};color:${INK};padding:32px 36px 28px;width:1000px}
</style>

<div style="${OSW};font-weight:700;font-size:12px;letter-spacing:2.4px;opacity:.6">MOCKUP · LEILÃO ONLINE · MONTE FINAL</div>
<h1 style="${OSW};font-weight:700;font-size:36px;line-height:1.04;text-transform:uppercase;margin:4px 0 6px">
  O time de <span style="color:${ROXO}">todo mundo</span> no Monte</h1>
<p style="${OSW};font-weight:400;font-size:14.5px;line-height:1.45;margin:0 0 20px;max-width:920px;opacity:.84">
  Igual já funciona na simulação: o <b>seu campinho primeiro</b> e os da sala embaixo, um atrás do outro.
  <b>Nada de marcar quem saiu</b> — quem decide isso é o host, no ⚙️ gerenciar.</p>

<div style="display:flex;gap:26px;align-items:flex-start">
  <div style="flex:none;width:430px">
    <div style="${OSW};font-weight:700;font-size:13px;letter-spacing:1.4px;opacity:.6;margin-bottom:8px">NA TELA DO MONTE</div>
    <div style="border:4px solid ${INK};border-radius:18px;background:${CREME};box-shadow:5px 5px 0 ${INK};padding:12px">
      ${topoMonte}
      <div style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;opacity:.5;margin:4px 0 6px">🫵 O SEU TIME</div>
      ${campinho(0, 150)}
      <div style="${OSW};font-weight:700;font-size:10px;letter-spacing:1.4px;opacity:.45;margin:12px 0 6px">🏟️ OS TIMES DA SALA</div>
      ${TIMES.slice(1, 4).map(t => `
        <div style="${OSW};font-weight:700;font-size:10.5px;opacity:.6;margin:9px 0 5px">👤 ${t.n}</div>
        ${campinho(t.b, 132)}`).join('')}
      <div style="text-align:center;${OSW};font-weight:700;font-size:12px;opacity:.45;margin-top:10px">⋮</div>
      <div style="text-align:center;${OSW};font-weight:400;font-size:11px;opacity:.6">e os demais da sala</div>
    </div>
  </div>

  <div style="flex:none;width:430px">
    <div style="${OSW};font-weight:700;font-size:13px;letter-spacing:1.4px;opacity:.6;margin-bottom:8px">NO ⚙️ GERENCIAR TÉCNICOS (só o host)</div>
    <div style="border:4px solid ${INK};border-radius:18px;background:${CREME};box-shadow:5px 5px 0 ${INK};padding:16px 14px">
      <div style="text-align:center;${OSW};font-weight:700;font-size:12px;opacity:.55;text-decoration:underline;margin-bottom:10px">⚙️ gerenciar técnicos</div>
      <div style="border:2px solid rgba(0,0,0,.15);border-radius:12px;background:#fff;padding:8px 9px;max-width:330px;margin:0 auto">
        <div style="${OSW};font-weight:700;font-size:9.5px;letter-spacing:2px;color:rgba(0,0,0,.4);text-transform:uppercase;padding:0 2px 5px">Remover da partida</div>
        ${TIMES.slice(1).map(t => linhaGerenciar(t.n, t.b, false)).join('')}
        ${linhaGerenciar('Bots do Marreco', 0, true)}
      </div>
      <div style="${OSW};font-weight:400;font-size:11.5px;line-height:1.45;opacity:.78;margin-top:14px;padding:0 4px">
        O <b>−5 🕳️</b> é quantas vagas o time dele ainda tem vazias. Time muito furado <b>pode</b> ser alguém que
        largou o jogo — mas também pode ser só quem perdeu os leilões. Por isso é <b>informação pra você decidir</b>,
        não um carimbo: quem remove continua sendo você.</div>
    </div>
  </div>
</div>

<div style="margin-top:22px;border:4px solid ${INK};border-radius:18px;background:#fff;box-shadow:5px 5px 0 ${INK};overflow:hidden">
  <div style="background:${INK};color:${GOLD};${OSW};font-weight:700;font-size:14.5px;letter-spacing:1.2px;
    padding:10px 14px;text-transform:uppercase">⚙️ como ficou por dentro</div>
  <div style="padding:12px 14px;${OSW};font-weight:400;font-size:13px;line-height:1.55">
    <div style="margin-bottom:7px">· É <b>o mesmo bloco</b> que a simulação já roda desde 09/08 — mesma regra
      (online rápido e Minhas Ligas), mesmo tamanho pequeno, mesmo manto da sala.</div>
    <div style="margin-bottom:7px">· 🐢 <b>O cuidado com o cronômetro:</b> a tela do Monte se redesenha 4× por
      segundo enquanto o relógio corre. A lista de campinhos foi <b>congelada</b> (memo) — ela só muda quando um
      elenco muda, não a cada tique do relógio. Sem isso, os até 20 campinhos redesenhariam junto.</div>
    <div>· ⏱️ E o tempo da vez segue <b>15 segundos</b>, sem mexer.</div>
  </div>
</div>`

const b = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'networkidle' })
await p.screenshot({ path: SAIDA, fullPage: true })
await b.close()
console.log(SAIDA)
