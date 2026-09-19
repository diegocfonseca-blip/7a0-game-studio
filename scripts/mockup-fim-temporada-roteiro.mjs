// ─── 🎬 MOCKUP: O FIM DE TEMPORADA VIRA UM ROTEIRO ──────────────────────────
//
// Ideia do Diego (19/09), com o print da tela de fim de temporada na mão:
// *"e se fizéssemos de uma forma q tivesse q ter o passo a passo obrigado e c
// isso teria q ler.. pq hj aparece essas coisas aqui misturadas embaixo tb q n
// estão legais.. q deveria aparecer melhor dps msm e até c visual melhor. A copa
// do mundo quero algo sutil msm mas após o jornal, seria algo novo, tudo novo
// pra essa tela"*.
//
// 📋 O QUE ESTÁ NA TELA HOJE, DE CIMA PRA BAIXO (conferido no print dele):
//   1. 👉 "Ver fases e resultados na aba Tabelas"
//   2. 🔒 COPA DO MUNDO LEGENDS — caixa grande, com barra "temporada 26 de 100"
//   3. 💰 Fechamento da temporada — uma linha fininha, escondida
//   4. 👉 SUA VEZ · Próxima temporada — os dois botões da decisão
//   5. os chips das fases da Copa (Peneira · Rodada de 64 · …), rolando de lado
//   6. 🚪 Sair e salvar carreira
// Tudo junto, na mesma rolagem, competindo entre si. O que MAIS IMPORTA (a
// decisão) divide espaço com o que menos importa agora (um cadeado de 74
// temporadas à frente).
//
// 🎯 A PROPOSTA: um passo de cada vez, na ordem em que a cabeça pede — primeiro a
//    NOTÍCIA (o jornal), depois o DINHEIRO, depois o de LONGE (a Copa do Mundo,
//    bem discreta), e só no fim a DECISÃO. Cada passo ocupa a tela inteira, tem
//    um botão só, e a barrinha em cima mostra quanto falta.
//
// ⚠️ A regra de ouro dele continua valendo: *"nada pode atrasar o ritmo do jogo"*.
//    Por isso cada passo é UM TOQUE, e nenhum deles pede pra pensar — só a última.
//
// Rodar: node scripts/mockup-fim-temporada-roteiro.mjs [--saida /tmp/roteiro.png]
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const SAIDA = arg('saida', '/tmp/fim-temporada-roteiro.png')

const b64 = w => fs.readFileSync(`scripts/fonts/oswald-latin-${w}-normal.woff2`).toString('base64')
const FONTES = [400, 500, 600, 700].map(w =>
  `@font-face{font-family:Oswald;src:url(data:font/woff2;base64,${b64(w)}) format('woff2');font-weight:${w};font-display:block}`).join('')
const ARTE = `data:image/webp;base64,${fs.readFileSync('src/escalacao/img/jornal-bola-ouro-v1.webp').toString('base64')}`

const INK = '#0C0C0C', CREME = '#F4ECD6', GOLD = '#FFC400', VERDE = '#1B7A3D', VERM = '#C2452F'
const TINTA2 = '#413825', TINTA3 = '#615039'
const SER = "Georgia,'Times New Roman',serif", OSW = 'Oswald,sans-serif'
const PAPEL = 'radial-gradient(circle at 30% 0%, #fbf3df 6%, #e3d0ad 150%)'

const bloco = (titulo, nota, dentro) => `
  <section style="margin-bottom:20px">
    <div style="font-family:${OSW};font-weight:700;font-size:16px;letter-spacing:.5px;color:${INK};text-transform:uppercase">${titulo}</div>
    <div style="font-size:11.5px;color:rgba(12,12,12,.62);margin:1px 0 8px;line-height:1.45">${nota}</div>
    ${dentro}
  </section>`

// 📱 a moldura do celular, pra ele ver como tela e não como caixinha
const tela = dentro => `
  <div style="border:3px solid ${INK};border-radius:16px;background:${CREME};box-shadow:4px 4px 0 rgba(12,12,12,.25);overflow:hidden">
    <div style="background:${INK};color:#fff;padding:5px 10px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:${OSW};font-weight:700;font-size:10px;letter-spacing:.8px">T26 · Encerrada · Várzea</span>
      <span style="font-family:${OSW};font-weight:700;font-size:10px;color:${GOLD}">🪙 168</span>
    </div>
    ${dentro}
  </div>`

// 🧭 A BARRA DO ROTEIRO — onde estou e quanto falta
const passos = (atual) => {
  const P = [['📰', 'Jornal'], ['💰', 'Caixa'], ['🌍', 'Mundo'], ['🔨', 'Próxima']]
  return `
  <div style="display:flex;align-items:center;gap:0;padding:10px 10px 4px;background:rgba(12,12,12,.05)">
    ${P.map(([ic, nome], i) => {
      const n = i + 1, feito = n < atual, ativo = n === atual
      return `
      ${i ? `<div style="flex:1;height:3px;background:${n <= atual ? INK : 'rgba(12,12,12,.18)'};margin:0 -1px;margin-bottom:14px"></div>` : ''}
      <div style="flex:none;text-align:center;width:52px">
        <div style="width:30px;height:30px;margin:0 auto;border:2.5px solid ${INK};border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;
                    background:${ativo ? GOLD : feito ? INK : '#fff'};color:${feito ? '#fff' : INK};
                    box-shadow:${ativo ? `2px 2px 0 ${INK}` : 'none'}">${feito ? '✓' : ic}</div>
        <div style="font-family:${OSW};font-weight:700;font-size:8.5px;letter-spacing:.4px;margin-top:3px;color:${ativo ? INK : 'rgba(12,12,12,.45)'}">${nome.toUpperCase()}</div>
      </div>`
    }).join('')}
  </div>`
}

const botao = (txt, cor = GOLD, sub) => `
  <div style="padding:10px 12px 12px">
    <div style="background:${cor};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:11px;text-align:center">
      <div style="font-family:${OSW};font-weight:700;font-size:17px;color:${cor === VERDE ? '#fff' : INK}">${txt}</div>
    </div>
    ${sub ? `<div style="text-align:center;font-size:10px;font-weight:700;color:rgba(12,12,12,.5);margin-top:5px">${sub}</div>` : ''}
  </div>`

// ── PASSO 1 · O JORNAL ──────────────────────────────────────────────────────
const passo1 = tela(`
  ${passos(1)}
  <div style="padding:8px 12px 0">
    <div style="background:${PAPEL};border:3px solid ${INK};border-radius:4px;overflow:hidden">
      <div style="padding:10px 11px 0;text-align:center">
        <div style="font-family:${SER};font-weight:700;font-size:30px;color:${INK};line-height:1">O MARTELO</div>
        <div style="font-family:${SER};font-weight:700;font-size:11px;color:${TINTA2}">TEMPORADA 26 · VÁRZEA</div>
        <div style="height:1.5px;background:#6c604a;margin:8px 0"></div>
        <div style="font-family:${SER};font-weight:700;font-size:19px;color:${INK};line-height:1.05;text-align:left">NEYMARZETTI SOBE E CALA A VÁRZEA</div>
        <div style="font-size:10.5px;font-style:italic;color:${TINTA3};text-align:left;margin-top:3px">Campanha de quem não deu chance pra ninguém.</div>
      </div>
      <div style="margin:9px 11px 0;padding:8px 9px;border:2.5px solid ${INK};background:rgba(255,255,255,.35)">
        <div style="font-family:${OSW};font-weight:700;font-size:9px;letter-spacing:1.8px;color:${TINTA3};text-align:center">NESTA EDIÇÃO</div>
        <div style="height:1.5px;background:${TINTA2};margin:5px 0 6px"></div>
        ${[['2', '🥇 A Bola de Ouro'], ['3', '🏆 Os donos da temporada'], ['4', '🕴️ O mercado']].map(([n, t]) => `
          <div style="display:flex;gap:7px;align-items:center;margin-bottom:4px">
            <span style="font-family:${OSW};font-weight:700;font-size:11px;color:${GOLD};background:${INK};border-radius:3px;padding:0 5px">${n}</span>
            <span style="font-family:${OSW};font-weight:700;font-size:12.5px;color:${INK}">${t}</span>
          </div>`).join('')}
      </div>
      <div style="position:relative;height:34px;margin-top:8px;border-top:2px solid rgba(65,56,37,.3)">
        <div style="position:absolute;left:11px;top:9px;font-family:${OSW};font-weight:700;font-size:9px;letter-spacing:1.2px;color:${TINTA3}">🥇 A BOLA DE OURO …</div>
        <div style="position:absolute;right:0;bottom:0;width:54px;height:54px;background:linear-gradient(225deg,#d9c39a 0%,#efe3c6 42%,#fbf5e6 100%);clip-path:polygon(100% 0,100% 100%,0 100%);box-shadow:-3px -3px 8px rgba(65,56,37,.35)"></div>
      </div>
    </div>
  </div>
  ${botao('📰 LER O JORNAL ›', GOLD, '4 páginas · dá pra pular pro fim')}
`)

// ── PASSO 2 · O CAIXA ───────────────────────────────────────────────────────
const linhaCaixa = (ic, txt, val, cor) => `
  <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(12,12,12,.1)">
    <span style="flex:none;font-size:14px">${ic}</span>
    <span style="flex:1;font-size:11.5px;font-weight:700;color:rgba(12,12,12,.75)">${txt}</span>
    <span style="font-family:${OSW};font-weight:700;font-size:15px;color:${cor}">${val}</span>
  </div>`
const passo2 = tela(`
  ${passos(2)}
  <div style="padding:10px 12px 0">
    <div style="background:linear-gradient(160deg,#1a1a1a,#0C0C0C);border:3px solid ${INK};border-radius:12px;padding:13px;color:#fff;box-shadow:3px 3px 0 rgba(0,0,0,.3)">
      <div style="font-family:${OSW};font-weight:700;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,.5);text-align:center">O CAIXA DA TEMPORADA 26</div>
      <div style="text-align:center;margin:6px 0 2px">
        <span style="font-family:${OSW};font-weight:700;font-size:46px;color:${GOLD};line-height:1">+50</span>
        <span style="font-size:22px">🪙</span>
      </div>
      <div style="text-align:center;font-size:10.5px;font-weight:700;color:rgba(255,255,255,.55)">de 118 pra <b style="color:#fff">168</b> moedas</div>
    </div>
    <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:9px 11px;margin-top:9px;box-shadow:3px 3px 0 rgba(12,12,12,.2)">
      <div style="font-family:${OSW};font-weight:700;font-size:11px;letter-spacing:1.2px;color:rgba(12,12,12,.5)">OS 10 LANÇAMENTOS</div>
      ${linhaCaixa('🏆', 'Prêmios da temporada', '+62', VERDE)}
      ${linhaCaixa('🎟️', 'Bilheteria', '+24', VERDE)}
      ${linhaCaixa('🤝', 'Patrocínio', '+18', VERDE)}
      ${linhaCaixa('💸', 'Folha salarial', '−41', VERM)}
      ${linhaCaixa('🕴️', 'Agência', '−13', VERM)}
      <div style="text-align:center;font-size:10px;font-weight:800;color:rgba(12,12,12,.4);margin-top:7px">+ 5 lançamentos · toque pra ver todos</div>
    </div>
  </div>
  ${botao('CONTINUAR ›', GOLD)}
`)

// ── PASSO 3 · A COPA DO MUNDO, DISCRETA ─────────────────────────────────────
const passo3 = tela(`
  ${passos(3)}
  <div style="padding:14px 12px 0">
    <div style="text-align:center;font-family:${OSW};font-weight:700;font-size:10px;letter-spacing:2.4px;color:rgba(12,12,12,.42)">LÁ NO HORIZONTE</div>
    <div style="background:linear-gradient(160deg,#141414,#000);border:3px solid ${INK};border-radius:14px;margin-top:8px;padding:16px 14px;color:#fff;box-shadow:3px 3px 0 rgba(12,12,12,.3);text-align:center">
      <div style="font-size:26px">🌍</div>
      <div style="font-family:${OSW};font-weight:700;font-size:17px;letter-spacing:.6px;margin-top:2px">COPA DO MUNDO LEGENDS</div>
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.55);line-height:1.45;margin-top:5px">
        Torneio de seleções. Abre na <b style="color:${GOLD}">temporada 100</b>, e só entra quem estiver no top 24 do mural.
      </div>
      <div style="margin-top:12px">
        <div style="height:7px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden">
          <div style="width:26%;height:100%;background:linear-gradient(90deg,#8a6d1f,${GOLD})"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:5px;font-family:${OSW};font-weight:700;font-size:10px;color:rgba(255,255,255,.45)">
          <span>TEMPORADA 26</span><span style="color:${GOLD}">FALTAM 74</span>
        </div>
      </div>
    </div>
    <div style="text-align:center;font-size:10.5px;font-weight:700;color:rgba(12,12,12,.45);margin-top:8px;line-height:1.4">
      Aparece uma vez por temporada, e só. Nada pra fazer aqui — é só pra você saber que ela existe.
    </div>
  </div>
  ${botao('CONTINUAR ›', GOLD)}
`)

// ── PASSO 4 · A DECISÃO (sozinha na tela) ───────────────────────────────────
const passo4 = tela(`
  ${passos(4)}
  <div style="padding:14px 12px 0">
    <div style="text-align:center">
      <span style="display:inline-block;background:${VERM};color:#fff;border:2.5px solid ${INK};border-radius:20px;padding:2px 12px;font-family:${OSW};font-weight:700;font-size:11px;letter-spacing:.8px;box-shadow:2px 2px 0 ${INK}">👉 AGORA É COM VOCÊ</span>
    </div>
    <div style="font-family:${OSW};font-weight:700;font-size:21px;color:${INK};text-align:center;margin-top:9px;line-height:1.1">Como você monta o time<br>da temporada 27?</div>
    <div style="font-size:11px;font-weight:700;color:rgba(12,12,12,.55);text-align:center;margin-top:5px;line-height:1.4">
      Acessos e quedas já entraram. Agora é escolher.
    </div>
    <div style="margin-top:13px;background:${GOLD};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:12px 13px">
      <div style="font-family:${OSW};font-weight:700;font-size:18px;color:${INK}">🔨 Leilão de transferências</div>
      <div style="font-size:10.5px;font-weight:700;color:rgba(12,12,12,.6);line-height:1.35;margin-top:3px">1 carta nova por posição + os jogadores que cada técnico listar.</div>
    </div>
    <div style="margin-top:9px;background:${VERDE};border:3px solid ${INK};border-radius:12px;box-shadow:3px 3px 0 ${INK};padding:12px 13px;color:#fff">
      <div style="font-family:${OSW};font-weight:700;font-size:18px">▶️ Mesmo time (sem leilão)</div>
      <div style="font-size:10.5px;font-weight:700;color:rgba(255,255,255,.72);line-height:1.35;margin-top:3px">Segue com o elenco de hoje. Você ainda decide os contratos.</div>
    </div>
    <div style="margin-top:12px;background:#fff;border:2.5px solid rgba(12,12,12,.35);border-radius:10px;padding:9px;text-align:center">
      <div style="font-family:${OSW};font-weight:700;font-size:14px;color:rgba(12,12,12,.7)">🚪 Sair e salvar carreira</div>
      <div style="font-size:9.5px;font-weight:700;color:rgba(12,12,12,.45);margin-top:2px">Fica guardada — é só voltar e continuar daqui.</div>
    </div>
  </div>
  <div style="height:12px"></div>
`)

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTES}
  *{box-sizing:border-box}
  body{margin:0;background:#E9DEC2;font-family:Arial,sans-serif;padding:20px 18px 26px;width:430px}
</style></head><body>
  <div style="font-family:${OSW};font-weight:700;font-size:25px;color:${INK};line-height:1.05">🎬 O FIM DE TEMPORADA VIRA ROTEIRO</div>
  <div style="font-size:12px;color:rgba(12,12,12,.6);margin:3px 0 14px;line-height:1.5">
    Um passo de cada vez, na ordem que a cabeça pede: a <b>notícia</b>, o <b>dinheiro</b>, o que está <b>longe</b>, e só no fim a <b>decisão</b>.
  </div>

  <div style="background:#FFF6E0;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2);margin-bottom:20px">
    <div style="font-family:${OSW};font-weight:700;font-size:14px;color:${INK}">📋 O QUE ESTÁ ERRADO HOJE</div>
    <div style="font-size:12px;color:rgba(12,12,12,.78);margin-top:6px;line-height:1.55">
      Na tua tela tem <b>seis coisas empilhadas</b> na mesma rolagem: o aviso das Tabelas, o cadeado da Copa do Mundo, o fechamento do caixa, a decisão da próxima temporada, os chips das fases e o sair.
      <br><br>O que <b>mais importa</b> (a decisão) divide espaço com o que <b>menos importa agora</b> — um cadeado que só abre daqui a <b>74 temporadas</b>. E o fechamento do caixa, que é a melhor parte, virou uma linha fininha que ninguém abre.
      <br><br>👉 Por isso <b>ninguém lê</b>. Não é falta de vontade, é tudo no mesmo peso.
    </div>
  </div>

  ${bloco('Passo 1 · O jornal', 'Primeiro a <b>notícia</b>. A capa já mostra que tem 4 páginas, e a orelha chama a próxima. É aqui que mora a Bola de Ouro.', passo1)}
  ${bloco('Passo 2 · O caixa', 'O fechamento ganha a tela inteira e um <b>número grande</b>: quanto entrou. Hoje isso é uma linha fininha que quase ninguém abre — e é a parte que dá gosto de ver.', passo2)}
  ${bloco('Passo 3 · A Copa do Mundo (discreta)', 'Você pediu <b>sutil</b>, e depois do jornal. Aqui ela não disputa espaço com nada: aparece uma vez, mostra o quanto falta, e sai de cena. Sem cadeado gritando no topo da tela.', passo3)}
  ${bloco('Passo 4 · A decisão', 'Sozinha na tela, sem nada em volta. É a <b>única</b> hora do roteiro em que ele precisa pensar — e agora ele chega aqui já sabendo tudo que aconteceu.', passo4)}

  <div style="background:#fff;border:3px solid ${INK};border-radius:12px;padding:11px 12px;box-shadow:3px 3px 0 rgba(0,0,0,.2)">
    <div style="font-family:${OSW};font-weight:700;font-size:14px;color:${INK}">⚡ E O RITMO?</div>
    <div style="font-size:12px;color:rgba(12,12,12,.75);margin-top:5px;line-height:1.5">
      Tua regra de ouro é <b>"nada pode atrasar o ritmo do jogo"</b> — e um passo a passo obrigatório pode virar pedágio. Por isso:
      <br><br>· cada passo é <b>um toque</b>, e nenhum pede pra pensar (só o último);
      <br>· o jornal tem <b>"pular pro fim"</b> pra quem já leu;
      <br>· quem quiser correr faz os 4 toques em <b>uns 3 segundos</b>.
      <br><br>🤔 <b>Onde eu tenho dúvida</b>: se depois da 20ª temporada isso cansa. Dá pra deixar o roteiro <b>obrigatório só na primeira vez</b> e, daí em diante, ter um "ver tudo de novo" — me fala se você quer assim ou obrigatório sempre.
    </div>
  </div>
</body></html>`

const nav = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const p = await nav.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 })
await p.setContent(html, { waitUntil: 'load' })
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: SAIDA, fullPage: true })
await nav.close()
console.log(`${SAIDA} · ${(fs.statSync(SAIDA).size / 1024).toFixed(0)} KB`)
