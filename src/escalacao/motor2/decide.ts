// 🧠 MOTOR 2D v2 — (B) a DECISÃO de quem está com a bola. A cada 0,25 s (e na hora, quando o marcador chega) ele compara
// as opções — chutar, passar pra cada companheiro (curto, enfiado, lançado, inversão), conduzir, driblar, cruzar, afastar,
// segurar — pela CHANCE DE DAR CERTO × o VALOR do lugar onde a bola fica − o CUSTO de perder ali. Os atributos e as
// tendências da carta mudam as chances e o gosto; um pouco de sorteio (menos pra quem decide bem) dá variedade sem perder
// a coerência. Nenhuma jogada é obrigatória: o Ronaldinho tenta mais drible porque GOSTA e porque DÁ CERTO mais vezes.
import { GIRO, gira, deCostas, AREA_LARG, AREA_PROF, L, W, aoSegmento, clamp, dist, frente, fundo, len, valor, xgDe } from './fisica'
import type { Atleta, TipoLance } from './tipos'
import type { Motor2 } from './motor'

export type Acao =
  | { tipo: 'chute'; u: number }
  | { tipo: TipoLance; para: Atleta; alvo: { x: number; y: number }; aereo: boolean; u: number }
  | { tipo: 'conduz' | 'drible' | 'segura'; alvo: { x: number; y: number }; u: number; contra?: Atleta }

/** 🎯 o quanto o time quer ganhar metros (por 10 m). O jogo dura 1:30 de tela: sem isto ele trocaria passe pra sempre */
const DIRETO = 0.1
/** 🧲 quanto vale CONTINUAR com a bola (por opção, × (2·pOk − 1)): o passe seguro ganha isso, a loteria perde. Sem isto o time
 *  trocava um passe de 90% por um lançamento de 40% só porque o lançamento caía mais perto do gol */
const MANTER = 0.03
/** 🎯 o gosto pelo chute de fora da área (> 23 m): menor = o time trabalha mais a bola até a área */
const CHUTE_LONGE = 1.6
/** 🎯 …e o gosto pelo chute de perto (≤ 23 m): chegou na cara do gol, bate */
const CHUTE_PERTO = 2.7
/** 🎯 quanto vale a chance de gol de um chute frente ao `valor` de ter a bola (1 = a mesma moeda) */
const ESCALA_CHUTE = 2.0
/** ↩️ o gosto pelo corte pra trás da linha de fundo (rasteiro, pra quem chega na marca do pênalti) */
const CORTE = 0.06
/** 🤝 o gosto pelo passe curto (até 11 m), maior quanto mais apertado ele está */
const TOQUE_CURTO = 0.028
/** 🔙 apertado, recuar pro zagueiro/lateral vale isto × a pressão (a zaga e os laterais entram no jogo) */
const SAIDA_TRAS = 0.05
/** 🔙 o castigo máximo de tocar pra trás (em "dezenas de metros" do DIRETO): −0,5 era tanto que o meia nunca recuava pro zagueiro */
const RECUO_MAX = -0.2
/** 🏃 o lateral que ultrapassa pede a bola */
const LAT_APOIO = 0.05
/** ↔️ jogar pelos lados: no meio-campo de ataque, a bola no companheiro LIVRE aberto (é dali que sai o cruzamento e o corte pra trás) */
const PELO_LADO = 0.02
/** 🔄 quanto vale rodar a bola pelo zagueiro/lateral livre (próprio campo e meio) */
const CIRCULA = 0.012
/** 🚀 o gosto pelo lançamento pro companheiro livre lá na frente */
const LANCAMENTO = 0.03
/** ↗️ o gosto pelo cruzamento com a bola rolando (21/10: mais jogo pelas pontas — cabeçada, corte e escanteio) */
const CRUZA = 1.8
/** 🧤 o goleiro comum (saída 55–74) prefere repor curto por isto */
const GOLEIRO_CURTO = 0.03
/** 👀 o quanto a falta de visão engana a leitura do passe (menor = o perna-de-pau força mais passe) */
const CEGUEIRA = 25
/** 🤝 o gosto por devolver a tabela (quem me tocou e saiu correndo) */
const TABELA = 0.03
/** ⚽ a partir desta finalização o jogador bate de primeira, sem ajeitar */
const CRAQUE_PRIMEIRA = 88

/** quanto custa PERDER a bola aqui (perto do próprio gol custa mais) */
const perda = (lado: 0 | 1, x: number, y: number) => 0.004 + valor((1 - lado) as 0 | 1, x, y) * 0.85 // (o que o RIVAL ganha se a bola ficar com ele ali)

/** 🧍 o que sobra de "costas" depois do giro de preparação da batida (~45°) — a mesma conta que a execução usa */
const costasDepoisDoGiro = (p: Atleta, dx: number, dy: number) => { const [fx, fy] = gira(p.fx, p.fy, dx, dy, GIRO.chute); return deCostas({ fx, fy }, dx, dy) }

export function pressaoEm(m: Motor2, p: { x: number; y: number }, lado: 0 | 1): number {
  let d = 9
  for (const a of m.atl) if (a.lado !== lado) d = Math.min(d, dist(a, p))
  return clamp(1 - (d - 1) / 5, 0, 1) // 1 = rival colado · 0 = livre (6 m+)
}

/** 🔬 gancho de bancada: vê as opções antes do sorteio (só scripts de medição usam; o jogo nunca liga) */
export const DEBUG_OPS: { f: ((p: Atleta, ops: Acao[]) => void) | null } = { f: null }
export function decide(m: Motor2, p: Atleta): Acao {
  const l = p.lado, adv = m.atl.filter(a => a.lado !== l), time = m.atl.filter(a => a.lado === l && a !== p)
  const f = frente(l, p.y), dxg = p.x - 34, dGol = len(dxg, f), pres = pressaoEm(m, p, l)
  const fy = l === 0 ? -1 : 1, aqui = valor(l, p.x, p.y), restr = m.parada?.tipo
  const ops: Acao[] = []
  const goleiro = p.grupo === 'GOL'
  // ⏳ acabou de receber: ainda não solta (domina e conduz), a não ser apertado ou com o gol na cara
  // 🤝 (quem me tocou saiu pra tabela: devolvo de primeira — o 1-2 não existe se eu "dominar e levantar a cabeça" antes)
  const tabelaPraMim = time.some(t => { const c = m.corrida.get(t); return !!c && c.tabela === p && c.ate > m.t })
  const cedo = restr === undefined && !goleiro && m.t < m.segurarAte && pres < 0.8 && !tabelaPraMim // (só solta antes com o marcador em cima — é aí que o duelo acontece)
  // ⏱️ TRANSIÇÃO × POSSE MONTADA (25/10, medido: 61% dos passes iam pro atacante, zagueiro 6% dos toques — o bônus de ganhar metros
  // decidia tudo). Acabou de roubar a bola: jogo direto, o rival está desarrumado. Com o bloco rival já montado (3 s+ de posse) o time
  // de verdade RODA a bola no próprio campo e no meio pra achar o lado fraco — o bônus de avançar cai pela metade e o zagueiro/lateral
  // livre vira opção; perto do gol (f < 45) continua direto, que é onde a jogada se decide
  const transicao = clamp(1 - (m.t - m.posseDesde - 3) / 4, 0, 1)
  const direto = f < 45 ? 1 : 0.65 + 0.35 * transicao

  // 🎯 CHUTAR
  // (22/10: o craque bate de primeira e de mais longe — é ele que transforma domínio em goleada; o fraco precisa ajeitar antes)
  const alcanceChute = 28 + clamp((p.at.finalizacao - 80) / 4, 0, 4), dePrimeira = p.at.finalizacao >= CRAQUE_PRIMEIRA
  if (!goleiro && (restr === undefined || restr === 'falta' || restr === 'penalti') && dGol < alcanceChute && f > 1 && !(cedo && dGol > 24 && !dePrimeira)) {
    const xg = xgDe(l, p.x, p.y, pres)
    // 🎯 25/10 (medido em 120 jogos: 76% dos chutes de fora da área, 23 m de média, e 55% viravam gol — ninguém entrava na área): o chute
    // vale a CHANCE DE GOL de verdade, na MESMA moeda do passe (`valor` = chance de a posse virar gol dali). Assim, de 25 m com um
    // companheiro livre na área, ele toca; na cara do gol, bate. O craque confia mais no chute dele (e acerta mais, em `chuta`)
    let u = xg * (1.0 + p.at.finalizacao / 300) * ESCALA_CHUTE
    u *= 1 - costasDepoisDoGiro(p, 34 - p.x, (l === 0 ? 0 : L) - p.y) * 0.6 // (🧍 de costas pro gol, quase nunca vale bater)
    // (dentro da área o instinto é chutar — o passe de 3 m pro companheiro marcado não resolve)
    if (f < AREA_PROF + 0.5 && Math.abs(dxg) < AREA_LARG) u *= CHUTE_PERTO
    // (de fora: só quem GOSTA e TEM chute arrisca — e mesmo assim, menos quanto mais longe. O time prefere chegar mais perto)
    if (dGol > 19) u *= (0.85 + p.tend.chuteLonge * 0.5) * (dGol > 24 ? CHUTE_LONGE * clamp((p.at.finalizacao - 55) / 30, 0.25, 1.3) : 1)
    if (dGol > 27) u *= 0.7
    // (na entrada da área, LIVRE, o profissional arrisca — é o chute de meia distância de verdade; marcado, procura o passe)
    if (dGol > 15 && dGol < 26) u *= 1 + clamp(1 - pres / 0.55, 0, 1) * 0.8
    if (restr === 'penalti') u = 9
    if (restr === 'falta' && dGol > 30) u = 0
    // ⚽ FALTA DIRETA × LEVANTADA (Diego 20/10): quem é batedor de falta (`falta_curva`/`falta_bomba`, estilo chutador) bate
    // direto; o resto prefere levantar na área (a opção de cruzamento abaixo)
    if (restr === 'falta' && dGol <= 30) u *= p.golpes.includes('falta_curva') || p.golpes.includes('falta_bomba') ? 4 : p.estilo === 'chutador' ? 2.6 : 1.1
    ops.push({ tipo: 'chute', u })
  }
  if (restr === 'penalti') return ops[0]

  // 🤝 PASSAR (pra cada companheiro: curto, enfiado nas costas, lançado, inversão)
  for (const t of cedo ? [] : time) {
    if (t.grupo === 'GOL' && fundo(l, p.y) > 30) continue
    const corre = m.corrida.get(t)
    const enfiada = !!corre && corre.ate > m.t && t.papel === 'infiltra' && dist(p, t) < 30
    // 👀 VISÃO (25/10, Diego: "a visão do jogador"): quem está atrás do corpo só é visto por quem tem visão (o craque "escaneia"
    // antes de receber; o perna-de-pau só enxerga o que está na frente). De frente, todo mundo vê
    // (25/10, medido: o zagueiro dava 6% dos toques porque está SEMPRE atrás do meia — e atrás do corpo ninguém "via" ele. Quem está
    // LIVRE tem tempo de olhar em volta antes de decidir: vê todo mundo; é só apertado que ele enxerga só o que tem na frente)
    if (!m.parada && pres > 0.35 && deCostas(p, t.x - p.x, t.y - p.y) > 0.55 + (p.at.visao - 60) / 100) continue
    // 🎯 o passe vai NA FRENTE de quem está correndo — no tempo que a bola leva pra chegar (antes era sempre 0,35 s)
    const d0 = dist(p, t), lead = clamp(d0 / 15, 0.2, 1.1)
    const alvo = enfiada ? { x: clamp(t.x + (corre!.alvo.x - t.x) * 0.5, 3, W - 3), y: clamp(t.y + (corre!.alvo.y - t.y) * 0.55, 2, L - 2) } : { x: clamp(t.x + t.vx * lead, 2, W - 2), y: clamp(t.y + t.vy * lead, 2, L - 2) }
    const d = dist(p, alvo)
    if (d < 3 || d > 58) continue // (25/10: o toque curto de 3–5 m existe — é ele que tira da pressão)
    if (restr === 'lateral' && d > 24) continue
    const lado = Math.abs(alvo.x - p.x) > 30 && Math.abs(alvo.y - p.y) < 25
    let aereo = d > 32 || (restr === 'tiro_de_meta' && d > 25)
    // risco no caminho (bola rasteira): cada rival perto da linha do passe pode cortar
    let pLinha = 1
    for (const a of adv) {
      const { q, s } = aoSegmento(a, p, alvo)
      // (o marcador COLADO em quem passa só corta se estiver exatamente na linha do passe — a bola sai do pé antes de ele reagir; e o
      // marcador do RECEPTOR já conta no `pRec`. Sem isto, um rival a 1,5 m do portador "bloqueava" todo passe pra frente)
      if (s < 0.15 && q > 0.5) continue
      if (s > 0.85) continue
      const tb = (s * d) / 19, alc = 1.6 + Math.min(tb, 1.5) * 4.6 // (o rival corre ~8 m/s: em 1 s de bola ele chega uns 4–5 m)
      // rival em cima da linha (≤ 1,6 m) bloqueia quase sempre; mais longe, depende do tempo que a bola dá pra ele
      if (q < 1.6) pLinha *= 0.12
      else if (q < alc) pLinha *= 1 - (1 - (q - 1.6) / (alc - 1.6)) * 0.7
    }
    if (pLinha < 0.55 && d > 14 && p.at.passe > 62) { aereo = true }
    // pelo alto: quem está perto de onde ela CAI disputa (e a bola caindo é mais difícil de dominar)
    // (bola longa é loteria — medido: 30–45% chega. Quem está perto de onde ela CAI disputa de cabeça)
    if (aereo) { pLinha = 0.68; for (const a of adv) { const q = dist(a, alvo); if (q < 10) pLinha *= 1 - (1 - q / 10) * 0.8 } }
    const conforto = 14 + p.at.passe * 0.24 + (aereo ? 8 : 0)
    // (🧍 o passe pra trás do corpo é mais difícil — de costas ele precisa girar ou tocar no improviso)
    const costas = costasDepoisDoGiro(p, alvo.x - p.x, alvo.y - p.y)
    const pTec = clamp(1 - Math.max(0, d - conforto) * 0.022 - (aereo ? 0.2 : 0), 0.3, 0.985) * (1 - pres * 0.12) * (1 - costas * 0.2)
    let rec = 9
    for (const a of adv) rec = Math.min(rec, dist(a, alvo))
    // (25/10, medido: 70% dos passes iam pro ATACANTE mesmo marcado — o marcador a 1 m ainda dava 55% de chance de receber. Agora o
    // jogador MARCADO é passe ruim (1 m → 37%, 4 m → 75%): é isso que faz o time procurar o zagueiro/lateral livre e rodar a bola)
    const pRec = clamp(0.25 + rec / 8, 0.25, 1)
    // 👀 (22/10) quem tem pouca VISÃO não enxerga o rival na linha do passe: acha que o passe está livre e força — é assim que o
    // time fraco entrega a bola pro time bom (a física do corte continua a mesma; só a LEITURA dele é que erra)
    const pVe = pLinha + (1 - pLinha) * clamp((75 - p.at.visao) / CEGUEIRA, 0, 0.7)
    const pOk = pTec * pVe * pRec
    const v = valor(l, alvo.x, alvo.y)
    // 🎯 JOGO DIRETO (o jogo inteiro cabe em 1:30): ganhar metros vale um bônus
    const avanca = (frente(l, p.y) - frente(l, alvo.y)) / 10
    // (no próprio campo o bônus de avançar é maior: transição rápida, não toque de bola na defesa)
    let u = pOk * (v + 0.008 + DIRETO * direto * clamp(avanca, RECUO_MAX, 1.5) * (aereo ? 0.4 : 1) * (frente(l, p.y) > 55 ? 1.15 : 1)) - (1 - pOk) * perda(l, alvo.x, alvo.y) - 0.002 + (2 * pOk - 1) * MANTER * (f < 30 ? 0.3 : 1) // (perto do gol não existe passe de segurança: vale arriscar) // (o bônus de ganhar metros tem teto: 40 m de bola longa não vale 4× um passe de 10)
    if (enfiada) u += 0.003 * (0.5 + p.at.visao / 200)
    // 🤝 a TABELA se completa: quem tocou e saiu pro espaço ganha a bola de volta — o 1-2 é a jogada mais bonita do futebol de passe
    if (enfiada && corre!.tabela === p) u += TABELA * (0.5 + p.at.visao / 200)
    // ↩️ O CORTE PRA TRÁS (25/10): chegou na linha de fundo pela ponta → a bola rasteira pra trás, pra quem chega na marca do pênalti, é
    // a jogada que mais faz gol no futebol de verdade
    const fAlvo = frente(l, alvo.y)
    if (f < 11 && Math.abs(p.x - 34) > 9 && !aereo && fAlvo > f && fAlvo < 15 && Math.abs(alvo.x - 34) < 10) u += pOk * CORTE
    // 🤝 (25/10) APERTADO, O TOQUE CURTO É O CERTO: tabela, parede, o apoio a 5–10 m — é assim que o profissional sai da pressão
    if (d < 11 && !aereo) u += pOk * TOQUE_CURTO * (0.35 + pres)
    // ⭐ O JOGO PASSA PELO CRAQUE: o time procura quem resolve (lenda com a bola vale mais que o volante com a bola)
    u += pOk * (((t.at.conducao + t.at.passe + t.at.finalizacao) / 3 - 70) / 1500)
    if (aereo) u += (p.tend.passeLongo - 0.5) * 0.03 // (bola longa é gosto de quem lança; o resto prefere o pé)
    // 🚀 LANÇAMENTO DE VERDADE (25/10, medido: 0,3 por jogo — quase não existia): o companheiro LIVRE lá na frente (ninguém a 8 m), com
    // 20 m+ de campo pra ganhar, vale a bola longa — é o lançamento do volante pro ponta, a virada de jogo do zagueiro
    if (aereo && !enfiada && rec > 8 && avanca > 2 && p.at.passe > 60) u += LANCAMENTO * clamp((p.at.passe - 60) / 30, 0.3, 1.2)
    // (pra trás: só quando é o melhor que tem — mas APERTADO, recuar pro zagueiro/lateral é o certo: é assim que o time sai do
    // aperto e a zaga participa do jogo. Diego 21/10: "zagueiro, lateral e goleiro quase não jogam")
    // (25/10, medido: zagueiro dava 6% dos toques — no futebol de verdade ~15%: o recuo pro zagueiro LIVRE quase não custa; ele é o
    // ponto de apoio pra rodar a bola e trocar o lado)
    if ((t.y - p.y) * fy < -3) u -= 0.006 * (1 - pres) * (t.grupo === 'DEF' && rec > 8 ? 0.6 : 1) - (t.grupo === 'DEF' || t.grupo === 'LAT' ? SAIDA_TRAS * pres : 0)
    // 🔄 CIRCULAÇÃO (25/10, medido: 61% dos toques eram dos atacantes; zagueiro 6%, lateral 4% — no futebol de verdade a defesa dá
    // ~35% dos toques): no próprio campo e no meio, o zagueiro/lateral LIVRE é opção de verdade — é assim que o time roda a bola e
    // acha o lado fraco, em vez de enfiar tudo no centroavante
    if ((t.grupo === 'LAT' || t.grupo === 'DEF') && pRec > 0.85 && f > 40) u += CIRCULA * (1 + 2 * (1 - transicao)) * (t.grupo === 'LAT' ? 1.3 : 1)
    // ↔️ PELOS LADOS (25/10, Diego: "faz o que deixa mais real"; medido: a bola passava só 3% do jogo a menos de 5 m da lateral): o meio
    // é onde a defesa se fecha — no campo de ataque, o companheiro livre ABERTO, à frente ou na linha da bola, é a saída natural
    if (Math.abs(alvo.x - 34) > 22 && Math.abs(p.x - 34) < Math.abs(alvo.x - 34) + 6 && fAlvo > 14 && fAlvo < 62 && fAlvo < f + 6 && pRec > 0.8) u += pOk * PELO_LADO
    // 🏃 o lateral que passou por fora (ultrapassagem) pede a bola — e ganha preferência na hora
    if (t.papel === 'ultrapassa' && t.grupo === 'LAT' && frente(l, p.y) < 60) u += LAT_APOIO
    // 🧤 REPOSIÇÃO CURTA × LONGA PELO ESTILO (Diego 20/10): o `goleiro_linha` (Ceni, Neuer…) sai jogando curto; quem tem boa
    // `saida` também; o paredão de pouca saída chuta longo
    // (o padrão é LONGO: o jogo de 1:30 não tem tempo pra saída de bola com 5 passes — só o `goleiro_linha` sai curto)
    // 🔁 21/10 (Diego: "o goleiro quase não joga"): todo goleiro sai CURTO quando o zagueiro/lateral está livre (o risco do passe já
    // está no `pOk`); o `goleiro_linha` sai curto ainda mais, e o paredão de pouca saída ainda prefere o chutão
    if (goleiro) { const curto = p.estilo === 'goleiro_linha' ? 0.05 : p.at.saida > 74 ? 0.04 : p.at.saida > 55 ? GOLEIRO_CURTO : -0.01; u += d < 30 ? curto : -curto }
    // 🏁 ESCANTEIO CURTO: na rotina "curta" o cobrador toca pro companheiro que veio buscar (e daí a jogada é a de sempre)
    if (restr === 'escanteio' && m.rotina[l] === 'curta' && m.curtaDe(t)) u += 0.35
    const tipo: TipoLance = goleiro || restr === 'tiro_de_meta' ? (d > 28 ? 'lancamento' : 'passe') : enfiada ? 'enfiada' : lado ? 'inversao' : aereo ? 'lancamento' : 'passe'
    ops.push({ tipo, para: t, alvo, aereo, u })
  }

  // ↗️ CRUZAR (pela ponta, perto da área, com gente lá dentro)
  // (na cobrança o que vale é onde está a BOLA — o cobrador pode estar um passo atrás da linha)
  const fCruz = restr ? frente(l, m.bola.y) : f
  if (!cedo && !goleiro && (restr === undefined || restr === 'escanteio' || restr === 'falta') && (p.x < 22 || p.x > W - 22 || restr === 'escanteio' || restr === 'falta') && fCruz < 35 && fCruz > -0.5) {
    const naArea = time.filter(t => frente(l, t.y) < AREA_PROF + 7 && Math.abs(t.x - 34) < AREA_LARG && t.grupo !== 'GOL')
    if (naArea.length) {
      // 🎯 BOLA PARADA ENSAIADA (Diego 20/10): no escanteio/falta levantada a bola vai pro ponto da ROTINA do time (1º pau ·
      // 2º pau), pro jogador que foi mandado pra lá — não "pro melhor cabeceador onde ele estiver"
      const ensaio = (restr === 'escanteio' || restr === 'falta') ? m.alvoDaRotina(l) : null
      const alvo = ensaio && naArea.includes(ensaio) ? ensaio : naArea.sort((a, b) => b.at.cabeceio - a.at.cabeceio)[0]
      const pt = ensaio === alvo ? { x: clamp(alvo.x, 26, 42), y: alvo.y } : { x: clamp(alvo.x + (34 - alvo.x) * 0.2, 26, 42), y: alvo.y }
      const u = ((0.05 + 0.025 * naArea.length) * (0.5 + alvo.at.cabeceio / 200) + p.tend.cruza * 0.03) * (restr === undefined ? CRUZA : 1) + (restr === 'escanteio' ? 0.3 : restr === 'falta' ? 0.12 : 0)
      ops.push({ tipo: 'cruzamento', para: alvo, alvo: pt, aereo: true, u })
      // 🔻 CRUZAMENTO RASTEIRO (25/10): com a bola rolando, o cruzamento baixo e forte pro 1º pau — quem chega primeiro empurra
      if (restr === undefined) {
        const lin1 = naArea.filter(t => Math.abs(t.x - 34) < 9).sort((a, b) => frente(l, a.y) - frente(l, b.y))[0]
        if (lin1) {
          let livre = 1
          for (const a of adv) { const { q, s } = aoSegmento(a, p, lin1); if (s > 0.1 && s < 0.95 && q < 1.4) livre *= 0.45 }
          ops.push({ tipo: 'cruzamento', para: lin1, alvo: { x: lin1.x, y: lin1.y }, aereo: false, u: u * 0.85 * livre * (0.6 + p.at.passe / 250) })
        }
      }
    }
  }

  if (!goleiro && restr === undefined) {
    // 🏃 CONDUZIR / 💫 DRIBLAR
    // (25/10, medido: a bola passava só 3% do jogo a menos de 5 m da lateral e quase nunca saía. O puxão pro meio (0,12/m) mandava o
    // ponta encostado na linha conduzir a ~73° pra dentro. Pelo lado, longe da área, ele CORRE PELA LINHA; perto da área, corta pra dentro)
    const pelaLinha = (p.x < 16 || p.x > W - 16) && f > 26
    const dir = { x: (34 - p.x) * (pelaLinha ? 0.025 : 0.12), y: fy }
    const n = len(dir.x, dir.y)
    const ux = dir.x / n, uy = dir.y / n
    // (quem gosta de driblar enxerga o marcador mais longe e vai pra cima dele — cone maior)
    const alc = 6 + p.tend.drible * 3, larg = 2.6 + p.tend.drible * 1.2
    const frenteDele = adv.filter(a => { const rx = a.x - p.x, ry = a.y - p.y, aa = rx * ux + ry * uy; return aa > -0.5 && aa < alc && len(rx - ux * aa, ry - uy * aa) < larg })
      .sort((a, b) => dist(a, p) - dist(b, p))[0]
    const passo = 7
    const alvo = { x: clamp(p.x + ux * passo, 3, W - 3), y: clamp(p.y + uy * passo, 2, L - 2) }
    const ganho = valor(l, alvo.x, alvo.y) - aqui
    if (!frenteDele) ops.push({ tipo: 'conduz', alvo, u: ganho + DIRETO * 0.7 + 0.006 + p.tend.drible * 0.006 + (p.estilo === 'velocista' ? 0.006 : 0) - pres * 0.01 + (1 - pres * 0.6) * MANTER })
    else {
      const pD = clamp(0.5 + (p.at.conducao - frenteDele.at.desarme) / 85, 0.12, 0.88)
      ops.push({ tipo: 'drible', alvo, contra: frenteDele, u: pD * (ganho + 0.02 + p.tend.drible * 0.08) - (1 - pD) * perda(l, p.x, p.y) + p.tend.drible * 0.06 - 0.006 + (2 * pD - 1) * MANTER }) // (quem GOSTA de driblar encara o marcador — Ronaldinho não solta a bola de primeira)
    }
    // 🦶 AFASTAR (apertado perto do próprio gol)
    if (fundo(l, p.y) < 28 && pres > 0.45) {
      // (perto da linha lateral o zagueiro manda pra FORA — lateral pro rival, mas sem perigo; no meio, isola pra frente)
      const praFora = p.x < 14 || p.x > W - 14
      const al = praFora ? { x: p.x < 34 ? -4 : W + 4, y: clamp(p.y + fy * 14, 4, L - 4) } : { x: clamp(p.x + (p.x < 34 ? -14 : 14), 4, W - 4), y: clamp(p.y + fy * 38, 4, L - 4) }
      const quem = [...time].filter(t => t.grupo !== 'GOL').sort((a, b) => dist(a, al) - dist(b, al))[0] ?? time[0]
      ops.push({ tipo: 'chutao', para: quem, alvo: al, aereo: true, u: 0.006 + pres * 0.03 })
    }
    // 🛡️ SEGURAR (protege a bola esperando alguém aparecer)
    ops.push({ tipo: 'segura', alvo: { x: clamp(p.x + (34 - p.x) * 0.05, 3, W - 3), y: p.y - fy * 0.5 }, u: -0.002 - pres * 0.015 })
  } else if (goleiro) ops.push({ tipo: 'segura', alvo: { x: p.x, y: p.y }, u: m.t - (m.donoDesde ?? m.t) < 1.2 ? 0.006 : -1 })

  // (bola parada sem opção na regra — lateral sem ninguém a 24 m, por exemplo: toca pro mais perto)
  if (!ops.length) {
    const t = [...time].filter(a => a.grupo !== 'GOL').sort((a, b) => dist(a, p) - dist(b, p))[0] ?? time[0]
    ops.push({ tipo: 'passe', para: t, alvo: { x: t.x, y: t.y }, aereo: dist(t, p) > 30, u: 0 })
  }
  if (DEBUG_OPS.f) DEBUG_OPS.f(p, ops)
  return escolhe(m, p, ops)
}




/** escolhe entre as boas opções: quem decide bem quase sempre pega a melhor; os outros variam mais */
function escolhe(m: Motor2, p: Atleta, ops: Acao[]): Acao {
  let max = -9
  for (const o of ops) max = Math.max(max, o.u)
  // (cansado decide pior: o gás baixo esquenta o sorteio)
  const T = (0.005 + (100 - p.at.decisao) * 0.0005) * (1 + (1 - p.gas) * 0.8)
  const corte = max - 3 * T
  let soma = 0
  const pesos = ops.map(o => { const w = o.u > corte ? (o.u - corte) * (o.u - corte) : 0; soma += w; return w })
  let r = m.r() * soma
  for (let i = 0; i < ops.length; i++) { r -= pesos[i]; if (r <= 0 && pesos[i] > 0) return ops[i] }
  return ops.reduce((a, b) => (b.u > a.u ? b : a))
}
