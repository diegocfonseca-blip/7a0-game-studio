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
const DIRETO = 0.012

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
  const cedo = restr === undefined && !goleiro && m.t < m.segurarAte && pres < 0.6

  // 🎯 CHUTAR
  if (!goleiro && (restr === undefined || restr === 'falta' || restr === 'penalti') && dGol < 33 && f > 1 && !(cedo && dGol > 14)) {
    const xg = xgDe(l, p.x, p.y, pres)
    let u = xg * (1.5 + p.at.finalizacao / 180)
    if (dGol > 19) u *= 0.55 + p.tend.chuteLonge * 1.2 // de longe só quem gosta (e tem chute)
    if (restr === 'penalti') u = 9
    if (restr === 'falta' && dGol > 30) u = 0
    ops.push({ tipo: 'chute', u })
  }
  if (restr === 'penalti') return ops[0]

  // 🤝 PASSAR (pra cada companheiro: curto, enfiado nas costas, lançado, inversão)
  for (const t of cedo ? [] : time) {
    if (t.grupo === 'GOL' && fundo(l, p.y) > 30) continue
    const corre = m.corrida.get(t)
    const enfiada = !!corre && corre.ate > m.t && t.papel === 'infiltra'
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
      if (s < 0.02 && q > 0.8) continue // (atrás de quem passa não corta)
      const tb = (s * d) / 19, alc = 1.6 + Math.min(tb, 1.5) * 4.6 // (o rival corre ~8 m/s: em 1 s de bola ele chega uns 4–5 m)
      // rival em cima da linha (≤ 1,6 m) bloqueia quase sempre; mais longe, depende do tempo que a bola dá pra ele
      if (q < 1.6) pLinha *= 0.12
      else if (q < alc) pLinha *= 1 - (1 - (q - 1.6) / (alc - 1.6)) * 0.7
    }
    if (pLinha < 0.55 && d > 14 && p.at.passe > 62) { aereo = true }
    // pelo alto: quem está perto de onde ela CAI disputa (e a bola caindo é mais difícil de dominar)
    if (aereo) { pLinha = 0.88; for (const a of adv) { const q = dist(a, alvo); if (q < 8) pLinha *= 1 - (1 - q / 8) * 0.8 } }
    const conforto = 14 + p.at.passe * 0.24 + (aereo ? 8 : 0)
    const pTec = clamp(1 - Math.max(0, d - conforto) * 0.022 - (aereo ? 0.12 : 0), 0.3, 0.985) * (1 - pres * 0.12)
    let rec = 9
    for (const a of adv) rec = Math.min(rec, dist(a, alvo))
    const pRec = clamp(0.5 + rec / 10, 0.5, 1)
    const pOk = pTec * pLinha * pRec
    const v = valor(l, alvo.x, alvo.y)
    // 🎯 JOGO DIRETO (o jogo inteiro cabe em 1:30): ganhar metros vale um bônus
    const avanca = (frente(l, p.y) - frente(l, alvo.y)) / 10
    let u = pOk * (v + 0.008 + DIRETO * Math.max(-0.5, avanca)) - (1 - pOk) * perda(l, alvo.x, alvo.y) - 0.002
    if (enfiada) u += 0.006 * (0.5 + p.at.visao / 200)
    if (aereo) u += (p.tend.passeLongo - 0.3) * 0.02
    if ((t.y - p.y) * fy < -3) u -= 0.003 // (pra trás: só quando é o melhor que tem)
    const tipo: TipoLance = goleiro || restr === 'tiro_de_meta' ? (d > 28 ? 'lancamento' : 'passe') : enfiada ? 'enfiada' : lado ? 'inversao' : aereo ? 'lancamento' : 'passe'
    ops.push({ tipo, para: t, alvo, aereo, u })
  }

  // ↗️ CRUZAR (pela ponta, perto da área, com gente lá dentro)
  if (!cedo && !goleiro && (restr === undefined || restr === 'escanteio' || restr === 'falta') && (p.x < 19 || p.x > W - 19 || restr === 'escanteio') && f < 32 && f > 0) {
    const naArea = time.filter(t => frente(l, t.y) < AREA_PROF + 2 && Math.abs(t.x - 34) < AREA_LARG && t.grupo !== 'GOL')
    if (naArea.length) {
      const alvo = naArea.sort((a, b) => b.at.cabeceio - a.at.cabeceio)[0]
      const pt = { x: clamp(alvo.x + (34 - alvo.x) * 0.2, 26, 42), y: alvo.y }
      const u = (0.02 + 0.014 * naArea.length) * (0.5 + alvo.at.cabeceio / 200) + p.tend.cruza * 0.02 + (restr === 'escanteio' ? 0.3 : 0)
      ops.push({ tipo: 'cruzamento', para: alvo, alvo: pt, aereo: true, u })
    }
  }

  if (!goleiro && restr === undefined) {
    // 🏃 CONDUZIR / 💫 DRIBLAR
    const dir = { x: (34 - p.x) * 0.12, y: fy }
    const n = len(dir.x, dir.y)
    const ux = dir.x / n, uy = dir.y / n
    const frenteDele = adv.filter(a => { const rx = a.x - p.x, ry = a.y - p.y, aa = rx * ux + ry * uy; return aa > -0.5 && aa < 6 && len(rx - ux * aa, ry - uy * aa) < 2.6 })
      .sort((a, b) => dist(a, p) - dist(b, p))[0]
    const passo = 7
    const alvo = { x: clamp(p.x + ux * passo, 3, W - 3), y: clamp(p.y + uy * passo, 2, L - 2) }
    const ganho = valor(l, alvo.x, alvo.y) - aqui
    if (!frenteDele) ops.push({ tipo: 'conduz', alvo, u: ganho + DIRETO * 0.7 + 0.006 + p.tend.drible * 0.006 + (p.estilo === 'velocista' ? 0.006 : 0) - pres * 0.01 })
    else {
      const pD = clamp(0.5 + (p.at.conducao - frenteDele.at.desarme) / 85, 0.12, 0.88)
      ops.push({ tipo: 'drible', alvo, contra: frenteDele, u: pD * (ganho + 0.02) - (1 - pD) * perda(l, p.x, p.y) + p.tend.drible * 0.03 - 0.006 })
    }
    // 🦶 AFASTAR (apertado perto do próprio gol)
    if (fundo(l, p.y) < 28 && pres > 0.45) {
      const al = { x: clamp(p.x + (p.x < 34 ? -14 : 14), 4, W - 4), y: clamp(p.y + fy * 38, 4, L - 4) }
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
  const T = 0.005 + (100 - p.at.decisao) * 0.0002
  const corte = max - 3 * T
  let soma = 0
  const pesos = ops.map(o => { const w = o.u > corte ? (o.u - corte) * (o.u - corte) : 0; soma += w; return w })
  let r = m.r() * soma
  for (let i = 0; i < ops.length; i++) { r -= pesos[i]; if (r <= 0 && pesos[i] > 0) return ops[i] }
  return ops.reduce((a, b) => (b.u > a.u ? b : a))
}
