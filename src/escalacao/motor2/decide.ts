// 🧠 MOTOR 2D v2 — (B) a DECISÃO de quem está com a bola. A cada 0,25 s (e na hora, quando o marcador chega) ele compara
// as opções — chutar, passar pra cada companheiro (curto, enfiado, lançado, inversão), conduzir, driblar, cruzar, afastar,
// segurar — pela CHANCE DE DAR CERTO × o VALOR do lugar onde a bola fica − o CUSTO de perder ali. Os atributos e as
// tendências da carta mudam as chances e o gosto; um pouco de sorteio (menos pra quem decide bem) dá variedade sem perder
// a coerência. Nenhuma jogada é obrigatória: o Ronaldinho tenta mais drible porque GOSTA e porque DÁ CERTO mais vezes.
import { AREA_LARG, AREA_PROF, L, W, aoSegmento, clamp, dist, frente, fundo, len, valor, xgDe } from './fisica'
import type { Atleta, TipoLance } from './tipos'
import type { Motor2 } from './motor'

export type Acao =
  | { tipo: 'chute'; u: number }
  | { tipo: TipoLance; para: Atleta; alvo: { x: number; y: number }; aereo: boolean; u: number }
  | { tipo: 'conduz' | 'drible' | 'segura'; alvo: { x: number; y: number }; u: number; contra?: Atleta }

/** 🎯 o quanto o time quer ganhar metros (por 10 m). O jogo dura 1:30 de tela: sem isto ele trocaria passe pra sempre */
const DIRETO = 0.075
/** 🧲 quanto vale CONTINUAR com a bola (por opção, × (2·pOk − 1)): o passe seguro ganha isso, a loteria perde. Sem isto o time
 *  trocava um passe de 90% por um lançamento de 40% só porque o lançamento caía mais perto do gol */
const MANTER = 0.03
/** 🎯 o gosto pelo chute de fora da área (> 23 m): menor = o time trabalha mais a bola até a área */
const CHUTE_LONGE = 1.0
/** 🎯 …e o gosto pelo chute de perto (≤ 23 m): chegou na cara do gol, bate */
const CHUTE_PERTO = 1.6
/** 🔙 apertado, recuar pro zagueiro/lateral vale isto × a pressão (a zaga e os laterais entram no jogo) */
const SAIDA_TRAS = 0.05
/** 🔙 o castigo máximo de tocar pra trás (em "dezenas de metros" do DIRETO): −0,5 era tanto que o meia nunca recuava pro zagueiro */
const RECUO_MAX = -0.2
/** 🏃 o lateral que ultrapassa pede a bola */
const LAT_APOIO = 0.05
/** ↗️ o gosto pelo cruzamento com a bola rolando (21/10: mais jogo pelas pontas — cabeçada, corte e escanteio) */
const CRUZA = 1.8
/** 🧤 o goleiro comum (saída 55–74) prefere repor curto por isto */
const GOLEIRO_CURTO = 0.03

/** quanto custa PERDER a bola aqui (perto do próprio gol custa mais) */
const perda = (lado: 0 | 1, x: number, y: number) => 0.004 + valor((1 - lado) as 0 | 1, x, y) * 0.85 // (o que o RIVAL ganha se a bola ficar com ele ali)

export function pressaoEm(m: Motor2, p: { x: number; y: number }, lado: 0 | 1): number {
  let d = 9
  for (const a of m.atl) if (a.lado !== lado) d = Math.min(d, dist(a, p))
  return clamp(1 - (d - 1) / 5, 0, 1) // 1 = rival colado · 0 = livre (6 m+)
}

export function decide(m: Motor2, p: Atleta): Acao {
  const l = p.lado, adv = m.atl.filter(a => a.lado !== l), time = m.atl.filter(a => a.lado === l && a !== p)
  const f = frente(l, p.y), dxg = p.x - 34, dGol = len(dxg, f), pres = pressaoEm(m, p, l)
  const fy = l === 0 ? -1 : 1, aqui = valor(l, p.x, p.y), restr = m.parada?.tipo
  const ops: Acao[] = []
  const goleiro = p.grupo === 'GOL'
  // ⏳ acabou de receber: ainda não solta (domina e conduz), a não ser apertado ou com o gol na cara
  const cedo = restr === undefined && !goleiro && m.t < m.segurarAte && pres < 0.8 // (só solta antes com o marcador em cima — é aí que o duelo acontece)

  // 🎯 CHUTAR
  if (!goleiro && (restr === undefined || restr === 'falta' || restr === 'penalti') && dGol < 31 && f > 1 && !(cedo && dGol > 24)) {
    const xg = xgDe(l, p.x, p.y, pres)
    let u = xg * (4.2 + p.at.finalizacao / 120)
    // (dentro da área o instinto é chutar — o passe de 3 m pro companheiro marcado não resolve)
    if (f < AREA_PROF + 0.5 && Math.abs(dxg) < AREA_LARG) u *= 1.5
    if (dGol > 19) u *= 1 + p.tend.chuteLonge * 1.0 // (de 19 a 31 m: cada vez menos conforme afasta — a posse vale mais que um chute de 30 m)
    u *= dGol > 23 ? CHUTE_LONGE : CHUTE_PERTO // (21/10: de longe entra pouco — o time prefere chegar mais perto)
    if (dGol > 27) u *= 0.7 // de longe mais quem gosta (e tem chute) — mas de vez em quando todo mundo arrisca (Diego 20/10)
    if (restr === 'penalti') u = 9
    if (restr === 'falta' && dGol > 30) u = 0
    // ⚽ FALTA DIRETA × LEVANTADA (Diego 20/10): quem é batedor de falta (`falta_curva`/`falta_bomba`, estilo chutador) bate
    // direto; o resto prefere levantar na área (a opção de cruzamento abaixo)
    if (restr === 'falta' && dGol <= 30) u *= p.golpes.includes('falta_curva') || p.golpes.includes('falta_bomba') ? 2.2 : p.estilo === 'chutador' ? 1.6 : 0.8
    ops.push({ tipo: 'chute', u })
  }
  if (restr === 'penalti') return ops[0]

  // 🤝 PASSAR (pra cada companheiro: curto, enfiado nas costas, lançado, inversão)
  for (const t of cedo ? [] : time) {
    if (t.grupo === 'GOL' && fundo(l, p.y) > 30) continue
    const corre = m.corrida.get(t)
    const enfiada = !!corre && corre.ate > m.t && t.papel === 'infiltra' && dist(p, t) < 30
    const alvo = enfiada ? { x: clamp(t.x + (corre!.alvo.x - t.x) * 0.5, 3, W - 3), y: clamp(t.y + (corre!.alvo.y - t.y) * 0.55, 2, L - 2) } : { x: clamp(t.x + t.vx * 0.35, 2, W - 2), y: clamp(t.y + t.vy * 0.35, 2, L - 2) }
    const d = dist(p, alvo)
    if (d < 5 || d > 58) continue
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
    const pTec = clamp(1 - Math.max(0, d - conforto) * 0.022 - (aereo ? 0.2 : 0), 0.3, 0.985) * (1 - pres * 0.12)
    let rec = 9
    for (const a of adv) rec = Math.min(rec, dist(a, alvo))
    const pRec = clamp(0.5 + rec / 10, 0.5, 1)
    const pOk = pTec * pLinha * pRec
    const v = valor(l, alvo.x, alvo.y)
    // 🎯 JOGO DIRETO (o jogo inteiro cabe em 1:30): ganhar metros vale um bônus
    const avanca = (frente(l, p.y) - frente(l, alvo.y)) / 10
    // (no próprio campo o bônus de avançar é maior: transição rápida, não toque de bola na defesa)
    let u = pOk * (v + 0.008 + DIRETO * clamp(avanca, RECUO_MAX, 1.5) * (aereo ? 0.4 : 1) * (frente(l, p.y) > 55 ? 1.6 : 1)) - (1 - pOk) * perda(l, alvo.x, alvo.y) - 0.002 + (2 * pOk - 1) * MANTER * (f < 30 ? 0.3 : 1) // (perto do gol não existe passe de segurança: vale arriscar) // (o bônus de ganhar metros tem teto: 40 m de bola longa não vale 4× um passe de 10)
    if (enfiada) u += 0.003 * (0.5 + p.at.visao / 200)
    // ⭐ O JOGO PASSA PELO CRAQUE: o time procura quem resolve (lenda com a bola vale mais que o volante com a bola)
    u += pOk * (((t.at.conducao + t.at.passe + t.at.finalizacao) / 3 - 70) / 900)
    if (aereo) u += (p.tend.passeLongo - 0.5) * 0.03 // (bola longa é gosto de quem lança; o resto prefere o pé)
    // (pra trás: só quando é o melhor que tem — mas APERTADO, recuar pro zagueiro/lateral é o certo: é assim que o time sai do
    // aperto e a zaga participa do jogo. Diego 21/10: "zagueiro, lateral e goleiro quase não jogam")
    if ((t.y - p.y) * fy < -3) u -= 0.006 * (1 - pres) - (t.grupo === 'DEF' || t.grupo === 'LAT' ? SAIDA_TRAS * pres : 0)
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
  if (!cedo && !goleiro && (restr === undefined || restr === 'escanteio' || restr === 'falta') && (p.x < 22 || p.x > W - 22 || restr === 'escanteio' || restr === 'falta') && f < 35 && f > 0) {
    const naArea = time.filter(t => frente(l, t.y) < AREA_PROF + 7 && Math.abs(t.x - 34) < AREA_LARG && t.grupo !== 'GOL')
    if (naArea.length) {
      // 🎯 BOLA PARADA ENSAIADA (Diego 20/10): no escanteio/falta levantada a bola vai pro ponto da ROTINA do time (1º pau ·
      // 2º pau), pro jogador que foi mandado pra lá — não "pro melhor cabeceador onde ele estiver"
      const ensaio = (restr === 'escanteio' || restr === 'falta') ? m.alvoDaRotina(l) : null
      const alvo = ensaio && naArea.includes(ensaio) ? ensaio : naArea.sort((a, b) => b.at.cabeceio - a.at.cabeceio)[0]
      const pt = ensaio === alvo ? { x: clamp(alvo.x, 26, 42), y: alvo.y } : { x: clamp(alvo.x + (34 - alvo.x) * 0.2, 26, 42), y: alvo.y }
      const u = ((0.05 + 0.025 * naArea.length) * (0.5 + alvo.at.cabeceio / 200) + p.tend.cruza * 0.03) * (restr === undefined ? CRUZA : 1) + (restr === 'escanteio' ? 0.3 : restr === 'falta' ? 0.12 : 0)
      ops.push({ tipo: 'cruzamento', para: alvo, alvo: pt, aereo: true, u })
    }
  }

  if (!goleiro && restr === undefined) {
    // 🏃 CONDUZIR / 💫 DRIBLAR
    const dir = { x: (34 - p.x) * 0.12, y: fy }
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
  return escolhe(m, p, ops)
}




/** escolhe entre as boas opções: quem decide bem quase sempre pega a melhor; os outros variam mais */
function escolhe(m: Motor2, p: Atleta, ops: Acao[]): Acao {
  let max = -9
  for (const o of ops) max = Math.max(max, o.u)
  // (cansado decide pior: o gás baixo esquenta o sorteio)
  const T = (0.005 + (100 - p.at.decisao) * 0.0002) * (1 + (1 - p.gas) * 0.8)
  const corte = max - 3 * T
  let soma = 0
  const pesos = ops.map(o => { const w = o.u > corte ? (o.u - corte) * (o.u - corte) : 0; soma += w; return w })
  let r = m.r() * soma
  for (let i = 0; i < ops.length; i++) { r -= pesos[i]; if (r <= 0 && pesos[i] > 0) return ops[i] }
  return ops.reduce((a, b) => (b.u > a.u ? b : a))
}
