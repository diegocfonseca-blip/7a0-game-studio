#!/usr/bin/env node
// ─── 🌎 MOCKUP: LIBERTADORES no modo rápido online ─────────────────────────
//
// Pedido do Diego (20/08): *"conseguimos fazer a Libertadores? no modo rápido
// online? ele ficaria lá igual tem o modo várzea... sabe as regras me mande
// mockup... e quais clubes entrariam de bots? pq são 32 né e não 20 igual na
// liga... além disso qd ativar esse modo libertadores N teria liga e nem copa
// ao criar sala"*.
//
// Tudo aqui foi MEDIDO no código, não chutado:
//   · `LEAGUE_SIZE = 20` (store.tsx) — a tabela de hoje tem 20 times
//   · `CLASSIC_CLUBS` (data.ts) — só 16 clubes-bot existem hoje
//   · `buildFixtures`/`oneDoubleRR` — turno e returno, 38 rodadas
//   · `seedQuickCopa`/`resolveQuickCopaTie` — a Copa dos 8 JÁ tem ida e volta
//     com pênalti no empate: é o motor que o mata-mata da Libertadores reusa
//   · o Bafo JÁ some com o seletor de Copa e escreve o porquê (lobby.tsx) —
//     é exatamente o padrão que o Diego pediu pra Libertadores
//
//   node scripts/mockup-libertadores.mjs --saida /tmp/libertadores.png
//
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const arg = (n, d = '') => { const i = process.argv.indexOf(`--${n}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d }
const saida = arg('saida', 'libertadores.png')
const b64 = p => fs.readFileSync(p).toString('base64')
const fonte = w => `data:font/woff2;base64,${b64(`scripts/fonts/oswald-latin-${w}-normal.woff2`)}`

// ── os 24 clubes do continente (INVENTADOS — a casa não usa clube real em
//    conteúdo de mentira; mesma regra dos 16 CLASSIC_CLUBS de hoje) ──────────
const CONTINENTE = [
  ['🇦🇷', 'Deportivo Tanguero'], ['🇦🇷', 'Rojos del Obelisco'], ['🇦🇷', 'Club Mate Amargo'],
  ['🇦🇷', 'Atlético Riachuelo'], ['🇦🇷', 'Pampa United'],
  ['🇺🇾', 'Garra Celeste FC'], ['🇺🇾', 'Charrúa del Plata'], ['🇺🇾', 'Deportivo Rambla'],
  ['🇨🇴', 'Cafeteros de Antioquia'], ['🇨🇴', 'Deportivo Vallenato'], ['🇨🇴', 'Esmeralda Andina'],
  ['🇨🇱', 'Cordillera FC'], ['🇨🇱', 'Austral del Sur'], ['🇨🇱', 'Deportivo Pacífico'],
  ['🇵🇾', 'Tereré United'], ['🇵🇾', 'Chaco Rojo FC'],
  ['🇪🇨', 'Mitad del Mundo FC'], ['🇪🇨', 'Deportivo Volcán'],
  ['🇵🇪', 'Inca del Pacífico'], ['🇵🇪', 'Machu FC'],
  ['🇧🇴', 'Altura 3.600'], ['🇧🇴', 'Deportivo Altiplano'],
  ['🇻🇪', 'Orinoco FC'], ['🇻🇪', 'Llanero United'],
]
// as 8 vagas do Brasil: quem joga entra primeiro; o que sobrar é sorteado
// entre os CLUBES BATIZADOS que já existem no jogo (data.ts)
const BATIZADOS = ['Neymarzetti', 'Nata de SP', 'Coringas do Diniz', 'Skyy FC', 'Marreco FC',
  'Tôka10', 'Império Samambaia', 'Manfré FC', 'Seven City', 'Remoçada', 'Deportivo Montreal']

const GRUPO = [
  ['🇧🇷', 'SEU TIME', 12, '+7', 1],
  ['🇦🇷', 'Deportivo Tanguero', 10, '+4', 2],
  ['🇨🇱', 'Cordillera FC', 6, '-1', 3],
  ['🇻🇪', 'Orinoco FC', 2, '-10', 4],
]

const linhaGrupo = ([fl, nm, pts, sg, pos]) => `
  <div class="gl ${pos <= 2 ? 'passa' : ''} ${nm === 'SEU TIME' ? 'eu' : ''}">
    <span class="gp">${pos}</span><span class="gf">${fl}</span>
    <span class="gn">${nm}</span><span class="gs">${sg}</span><span class="gt">${pts}</span>
  </div>`

const miniGrupo = (letra, destaque) => `
  <div class="mg ${destaque ? 'on' : ''}">
    <p class="mgt">GRUPO ${letra}</p>
    ${[0, 1, 2, 3].map(i => `<span class="mgb ${i < 2 ? 'ok' : ''}"></span>`).join('')}
  </div>`

const chave = (fase, jogos, nota) => `
  <div class="fase">
    <p class="fnome">${fase}</p>
    <p class="fjogos">${jogos}</p>
    <p class="fnota">${nota}</p>
  </div>`

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:D;src:url(${fonte(400)}) format('woff2');font-weight:400}
@font-face{font-family:D;src:url(${fonte(600)}) format('woff2');font-weight:600}
@font-face{font-family:D;src:url(${fonte(700)}) format('woff2');font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;background:#F4ECD6;color:#0C0C0C;font-family:system-ui,'Segoe UI',Roboto,sans-serif;padding:38px 34px 30px}
.pill{display:inline-flex;align-items:center;gap:10px;background:#FFC400;border:3px solid #0C0C0C;border-radius:999px;
  padding:8px 20px;font-family:D,sans-serif;font-weight:700;font-size:15px;letter-spacing:.11em;text-transform:uppercase;
  box-shadow:4px 4px 0 #0C0C0C}
h1{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:62px;line-height:.97;margin:18px 0 0}
h1 .g{color:#1B7A3D}
.lead{font-size:17px;line-height:1.45;font-weight:600;color:rgba(12,12,12,.74);margin-top:12px;max-width:930px}
.lead b{color:#0C0C0C}
h2{font-family:D,sans-serif;text-transform:uppercase;font-weight:700;font-size:23px;margin:34px 0 12px;letter-spacing:.03em;
  display:flex;align-items:baseline;gap:11px}
h2 small{font-family:system-ui,sans-serif;font-size:13px;font-weight:600;text-transform:none;letter-spacing:0;color:rgba(12,12,12,.5)}
.cx{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#fff;padding:16px 18px}

/* ── tela de criar sala (fundo escuro, igual ao jogo) ── */
.par{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.tela{border:4px solid #0C0C0C;border-radius:16px;box-shadow:5px 5px 0 #0C0C0C;background:#1C1A17;padding:14px 15px}
.rotulo{font-family:D,sans-serif;font-weight:700;font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:6px}
.seg{display:flex;border:2.5px solid #0C0C0C;border-radius:12px;overflow:hidden}
.seg b{flex:1;text-align:center;font-family:D,sans-serif;font-weight:700;font-size:12.5px;padding:9px 3px;background:#fff;color:#000}
.seg b.on{background:#FFC400}
.seg b.off{opacity:.45}
.aj{font-size:11px;font-weight:700;color:rgba(255,255,255,.5);line-height:1.4;margin-top:7px}
.aj b{color:#FFC400}
.bloco{margin-top:13px}
.sumiu{border:2.5px dashed rgba(255,255,255,.35);border-radius:12px;padding:10px 12px;background:rgba(255,255,255,.05)}
.sumiu p{font-family:D,sans-serif;font-weight:700;font-size:12.5px;color:#FFC400}
.sumiu span{display:block;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,.5);line-height:1.4;margin-top:4px}

/* ── grupos ── */
.grupos{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;align-items:start}
.gl{display:flex;align-items:center;gap:9px;border:2.5px solid #0C0C0C;border-radius:11px;padding:7px 10px;background:#fff;margin-bottom:6px}
.gl.passa{background:#E7F5EC}
.gl.eu{background:#FFF2C4;box-shadow:3px 3px 0 #0C0C0C}
.gp{font-family:D,sans-serif;font-weight:700;font-size:14px;width:18px;color:rgba(12,12,12,.4)}
.gl.passa .gp{color:#1B7A3D}
.gf{font-size:17px}
.gn{flex:1;font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase}
.gs{font-size:12.5px;font-weight:700;color:rgba(12,12,12,.5);width:40px;text-align:right}
.gt{font-family:D,sans-serif;font-weight:700;font-size:17px;width:32px;text-align:right}
.gcap{display:flex;gap:8px;font-size:11.5px;font-weight:700;color:rgba(12,12,12,.6);margin-top:8px}
.gcap i{font-style:normal;background:#E7F5EC;border:2px solid #0C0C0C;border-radius:7px;padding:1px 7px}
.mgs{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.mg{border:2.5px solid #0C0C0C;border-radius:11px;background:#fff;padding:7px 8px}
.mg.on{background:#FFF2C4;box-shadow:3px 3px 0 #0C0C0C}
.mgt{font-family:D,sans-serif;font-weight:700;font-size:10.5px;letter-spacing:.06em;margin-bottom:5px}
.mgb{display:block;height:7px;border-radius:4px;background:rgba(12,12,12,.16);margin-bottom:3px}
.mgb.ok{background:#1B7A3D}

/* ── chaveamento ── */
.chave{display:grid;grid-template-columns:repeat(5,1fr);gap:11px}
.fase{border:3px solid #0C0C0C;border-radius:13px;background:#fff;padding:11px 10px;text-align:center;box-shadow:3px 3px 0 #0C0C0C}
.fase:last-child{background:#FFC400}
.fnome{font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase}
.fjogos{font-size:12px;font-weight:700;color:rgba(12,12,12,.62);margin-top:3px;line-height:1.3}
.fnota{font-size:10.5px;font-weight:700;color:rgba(12,12,12,.45);margin-top:5px;line-height:1.3}

/* ── clubes ── */
.paises{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.club{display:flex;align-items:center;gap:7px;border:2.5px solid #0C0C0C;border-radius:10px;background:#fff;padding:6px 9px}
.club span{font-size:15px}
.club p{font-family:D,sans-serif;font-weight:700;font-size:13px;text-transform:uppercase;line-height:1.15}
.br{margin-top:11px;border:3px solid #0C0C0C;border-radius:13px;background:#E7F5EC;padding:12px 14px;box-shadow:4px 4px 0 #0C0C0C}
.br p.t{font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase}
.br p.d{font-size:13.5px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.78);margin-top:5px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.chip{border:2px solid #0C0C0C;border-radius:999px;background:#fff;padding:3px 10px;font-family:D,sans-serif;font-weight:700;font-size:12px;text-transform:uppercase}

/* ── regras ── */
.regras{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px}
.reg{display:flex;gap:11px;align-items:flex-start}
.reg .n{font-family:D,sans-serif;font-weight:700;font-size:20px;color:#C2452F;line-height:1;width:24px;flex:0 0 24px}
.reg p{font-size:14px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.8)}
.reg p b{color:#0C0C0C}
.alerta{margin-top:12px;border:3px solid #0C0C0C;border-radius:13px;background:#FDECE8;padding:11px 14px}
.alerta p{font-size:13.5px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.82)}
.alerta b{color:#C2452F}
.rodape{display:flex;align-items:center;justify-content:space-between;margin-top:26px;padding:0 4px}
.marca{font-family:D,sans-serif;font-weight:700;font-size:22px}
.marca span{color:#C2452F}
.site{font-size:13px;color:rgba(12,12,12,.42)}
</style>

<div class="pill">🌎 Mockup · Libertadores no rápido online</div>
<h1>32 clubes. Grupos, mata-mata<br>e <span class="g">final única</span>.</h1>
<p class="lead">Uma <b>competição nova</b> na hora de criar a sala do rápido online — do lado de onde hoje você escolhe
Liga ou Liga + Copa. Ligou a Libertadores, <b>não tem liga nem copa</b>: é o torneio inteiro, do sorteio dos grupos
até a taça. E é <b>mais curto</b> que a liga de hoje.</p>

<h2>1 · Onde entra <small>na tela de criar sala, no mesmo bloco de sempre</small></h2>
<div class="par">
  <div class="tela">
    <p class="rotulo">Competição</p>
    <div class="seg"><b class="on">🏁 Liga</b><b>🌎 Libertadores</b></div>
    <p class="aj">🏁 <b>Liga</b>: 20 clubes, turno e returno — <b>38 rodadas</b>.</p>
    <div class="bloco">
      <p class="rotulo">Depois da liga</p>
      <div class="seg"><b class="on">🏆 Liga + Copa</b><b>📊 Só liga</b></div>
    </div>
  </div>
  <div class="tela">
    <p class="rotulo">Competição</p>
    <div class="seg"><b>🏁 Liga</b><b class="on">🌎 Libertadores</b></div>
    <p class="aj">🌎 <b>Libertadores</b>: 32 clubes em 8 grupos, mata-mata e final única — <b>13 rodadas</b>.</p>
    <div class="bloco">
      <div class="sumiu">
        <p>Sem liga e sem copa</p>
        <span>Na Libertadores o seletor de Copa <b>some da tela</b> — não fica ligado fingindo que escolhe. É o torneio inteiro, do começo ao fim.</span>
      </div>
    </div>
  </div>
</div>

<h2>2 · Fase de grupos <small>8 grupos de 4 · todos contra todos, ida e volta</small></h2>
<div class="grupos">
  <div class="cx">
    <p style="font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:9px">Grupo A · última rodada</p>
    ${GRUPO.map(linhaGrupo).join('')}
    <div class="gcap"><i>Os 2 primeiros passam</i><span>·  6 jogos por clube  ·  o 3º e o 4º estão fora</span></div>
  </div>
  <div class="cx">
    <p style="font-family:D,sans-serif;font-weight:700;font-size:15px;text-transform:uppercase;margin-bottom:9px">Os 8 grupos</p>
    <div class="mgs">${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(l => miniGrupo(l, l === 'A')).join('')}</div>
    <p style="font-size:12.5px;font-weight:600;line-height:1.42;color:rgba(12,12,12,.72);margin-top:11px">
      <b>Quem joga nunca cai no mesmo grupo</b> — igual à regra de verdade (clube do mesmo país não se enfrenta na
      primeira fase). Amigo só cruza com amigo <b>no mata-mata</b>, e aí é decisão.</p>
  </div>
</div>

<h2>3 · Mata-mata <small>o mesmo motor da Copa dos 8 que já existe: ida, volta e pênalti no empate</small></h2>
<div class="chave">
  ${chave('Oitavas', '16 clubes', 'ida e volta')}
  ${chave('Quartas', '8 clubes', 'ida e volta')}
  ${chave('Semis', '4 clubes', 'ida e volta')}
  ${chave('FINAL', '2 clubes', 'jogo único')}
  ${chave('🏆 TAÇA', 'campeão', 'sem empate: vai a pênalti')}
</div>

<h2>4 · Os 32 clubes <small>24 do continente (fixos) + 8 vagas do Brasil</small></h2>
<div class="cx">
  <div class="paises">${CONTINENTE.map(([f, n]) => `<div class="club"><span>${f}</span><p>${n}</p></div>`).join('')}</div>
  <div class="br">
    <p class="t">🇧🇷 As 8 vagas do Brasil são de vocês</p>
    <p class="d">Quem está na sala ocupa as vagas brasileiras <b>primeiro</b> — você é o representante do Brasil.
      O que sobrar é <b>sorteado entre os clubes batizados</b> que já existem no jogo, e o sorteio muda a cada torneio.</p>
    <div class="chips">${BATIZADOS.map(n => `<span class="chip">${n}</span>`).join('')}<span class="chip">…</span></div>
  </div>
</div>

<h2>5 · As regras, em ordem</h2>
<div class="cx">
  <div class="regras">
    <div class="reg"><span class="n">1</span><p><b>Sorteio</b>: 32 clubes em 8 grupos de 4, por potes de força — cada grupo leva um forte, um médio e assim por diante. Ninguém pega um grupo da morte por azar.</p></div>
    <div class="reg"><span class="n">2</span><p><b>Grupos</b>: todos contra todos, ida e volta. <b>6 jogos</b> por clube. Passam os <b>2 primeiros</b>.</p></div>
    <div class="reg"><span class="n">3</span><p><b>Desempate no grupo</b>: pontos → vitórias → saldo → gols marcados. <b>É a mesma regra do resto do jogo</b> — uma regra só pra decorar.</p></div>
    <div class="reg"><span class="n">4</span><p><b>Mata-mata</b>: oitavas, quartas e semi em <b>ida e volta</b>, soma dos dois jogos. Empatou, <b>pênalti</b> — gol fora não vale mais, igual à Libertadores de hoje.</p></div>
    <div class="reg"><span class="n">5</span><p><b>Final única</b>: um jogo só, campo neutro. Empatou no tempo normal, <b>pênalti na hora</b>. É a decisão mais curta e mais tensa do jogo.</p></div>
    <div class="reg"><span class="n">6</span><p><b>O leilão não muda em nada</b>: é o mesmo pregão de hoje, uma vez só, antes de tudo. Muda o que acontece <b>depois</b> dele.</p></div>
    <div class="reg"><span class="n">7</span><p><b>13 rodadas no total</b> (6 de grupo + 7 de mata-mata), contra as 38 da liga. Partida de Libertadores dura <b>menos de um terço</b> de uma liga inteira.</p></div>
    <div class="reg"><span class="n">8</span><p><b>Fim de jogo</b>: além do campeão, cada um vê <b>até onde chegou</b> (grupos, oitavas, quartas, semi, vice, campeão) e <b>quem eliminou quem</b>.</p></div>
  </div>
  <div class="alerta">
    <p>⚠️ <b>O que você precisa decidir:</b> na Libertadores <b>quem perde, cai</b>. Se você é eliminado no grupo,
      ainda faltam 7 rodadas de mata-mata pra assistir — hoje já acontece parecido com a Copa dos 8 (quem não fica no
      top 8 assiste), mas na Libertadores dá pra cair mais cedo. Se você preferir, dá pra fazer a versão em que
      <b>quem cai no grupo entra numa segunda chave</b> (tipo Sul-Americana) e continua jogando. É só falar qual das duas.</p>
  </div>
</div>

<h2>6 · O que NÃO muda <small>e como voltar atrás</small></h2>
<div class="cx">
  <div class="regras">
    <div class="reg"><span class="n">✓</span><p>A <b>liga normal do rápido continua intocada</b> — 20 clubes, 38 rodadas, Copa dos 8 no fim. A Libertadores é uma opção A MAIS, e só existe se o host ligar.</p></div>
    <div class="reg"><span class="n">✓</span><p><b>Carreira, Bafo e Liga Fechada não são tocados.</b> Nada de sala existente muda de comportamento.</p></div>
    <div class="reg"><span class="n">✓</span><p>Nasce <b>invisível</b>, só na sua conta, como a Liga Fechada — você aprova a cara antes de qualquer pessoa ver.</p></div>
    <div class="reg"><span class="n">↩️</span><p>Reverter é <b>desligar a opção</b>: as salas de liga nem sabem que ela existe. Nenhuma carreira, álbum ou ranking é afetado.</p></div>
  </div>
</div>

<div class="rodape">
  <div class="marca">⚽ Leilão <span>Legends</span></div>
  <div class="site">leilaolegends.com</div>
</div>`

const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1500 }, deviceScaleFactor: 2 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: saida, fullPage: true })
await browser.close()
console.log(`${saida} · ${(fs.statSync(saida).size / 1024).toFixed(0)} KB`)
