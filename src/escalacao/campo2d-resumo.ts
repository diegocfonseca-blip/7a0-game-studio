// 📊😱 RESUMO DO APITO + "QUASE!" do Campo 2D (04/11) — a REGRA, uma só, pros dois campos (aba Jogos e mapa).
// Lê o que o motor JÁ mostrou na tela (v1: `Jogo2D.lances`; v2: `Motor2.stats`/`eventos`) e só conta. Nada aqui sorteia, mexe em
// placar, relógio ou resultado: é apresentação pura.
//   · 📊 resumo: posse, chutes, chutes no gol e o ⭐ melhor em campo (dos dois times) — só existe DEPOIS do apito (lei anti-spoiler).
//   · 😱 QUASE!: bola na TRAVE e defesa DIFÍCIL ganham o grito na faixa do locutor + um anel na tela (e o "uhhh" da torcida no mapa).
//     A faixa troca a frase do motor pela do QUASE (o mesmo lance, uma faixa só — nada de dois teatros dizendo a mesma coisa).
// ⛔ Pênalti nunca entra aqui (tem tela própria).
import { frase } from './campo2d-narracao'
import type { LanceApres } from './campo2d-motor'

export type Par = [number, number]
export type ResumoCampo2D = { posse: Par; chutes: Par; noAlvo: Par; craque: { nome: string; lado: 0 | 1 } | null }
export type QuaseCampo2D = { k: string; tipo: 'trave' | 'defesa'; lado: 0 | 1; nome: string; goleiro?: string; x: number; y: number }

/** quanto dura o QUASE na tela (o grito na faixa) e o anel (s de relógio de verdade) */
export const QUASE_FAIXA_MS = 2600, QUASE_ANEL_MS = 900

// o que o v2 (motor2) entrega: só os campos que a gente lê (sem importar o motor inteiro)
type EventoV2 = { t: number; tipo: string; lado: 0 | 1; a?: string; b?: string }
type JogoLido = {
  t: number; placar: number[]; festa?: unknown; bola: { x: number; y: number; dono?: { lado: 0 | 1 } | null }; posse?: 0 | 1
  lances?: LanceApres[]; posseT?: Par; eventos?: EventoV2[]; stats?: { posse: Par; chutes: Par; noAlvo: Par }
}
type Carta = { name: string; club?: string; fake?: boolean }
/** 🚫🧍 jogador de mentira não tem estatística (regra do Diego 19/09) — a mesma régua do `ehFake` (store) */
const fake = (c?: Carta) => !!c && (!!c.fake || c.club === 'Várzea' || c.club === 'Pickup')

/** O coletor: o campinho chama `passo(jogo)` a cada quadro (fora do replay) e lê `novoQuase()` / `resumo()`. */
export function criaColetorCampo2D() {
  let iLance = 0, iEv = 0, nQuase = 0
  const pendentes: QuaseCampo2D[] = []
  const quaseDe = (tipo: 'trave' | 'defesa', lado: 0 | 1, nome: string, x: number, y: number, goleiro?: string): QuaseCampo2D =>
    ({ k: `${tipo}|${lado}|${nome}|${++nQuase}`, tipo, lado, nome, goleiro, x, y })
  return {
    /** o resumo já foi tirado (uma vez por jogo) */
    feito: false,
    passo(j: JogoLido) {
      // (😱 só vale QUASE de AGORA: quem abre o campinho no meio do jogo não ganha um grito velho)
      const agora = (t: number) => j.t - t < 1.5
      if (j.lances) for (; iLance < j.lances.length; iLance++) {
        const l = j.lances[iLance]
        if (!agora(l.t)) continue
        if (l.tipo === 'trave') pendentes.push(quaseDe('trave', l.lado, l.nome, l.x ?? 34, l.y ?? 0))
        else if (l.tipo === 'defesa' && l.dificil) pendentes.push(quaseDe('defesa', l.lado, l.nome, l.x ?? 34, l.y ?? 0, l.goleiro))
      }
      if (j.eventos) for (; iEv < j.eventos.length; iEv++) {
        const e = j.eventos[iEv]
        if (!agora(e.t)) continue
        // (v2: 'trave' vem com o lado de quem ATACOU; 'espalma' — o voo, a defesa difícil — com o lado do goleiro)
        if (e.tipo === 'trave') { const x = j.bola.x < 34 ? 34 - 3.66 : 34 + 3.66; pendentes.push(quaseDe('trave', e.lado, e.a ?? '', x, j.bola.y < 52.5 ? 0 : 105)) }
        else if (e.tipo === 'espalma') pendentes.push(quaseDe('defesa', (1 - e.lado) as 0 | 1, '', j.bola.x, j.bola.y, e.a))
      }
    },
    /** o QUASE que acabou de acontecer (um por vez; o mais novo ganha) */
    novoQuase(): QuaseCampo2D | null { const q = pendentes.pop() ?? null; pendentes.length = 0; return q },
    /** 📊 o resumo do jogo — chamar só depois do apito */
    resumo(j: JogoLido, cartas: [Carta[] | undefined, Carta[] | undefined]): ResumoCampo2D {
      const carta = new Map<string, Carta>()
      for (const c of [...(cartas[0] ?? []), ...(cartas[1] ?? [])]) carta.set(c.name, c)
      const pontos = new Map<string, { lado: 0 | 1; p: number }>()
      const soma = (nome: string | undefined, lado: 0 | 1, p: number) => {
        if (!nome || /\((contra|own goal)\)/i.test(nome) || fake(carta.get(nome))) return
        const o = pontos.get(nome) ?? { lado, p: 0 }; o.p += p; pontos.set(nome, o)
      }
      let chutes: Par = [0, 0], noAlvo: Par = [0, 0], pp: Par = [...(j.posseT ?? [1, 1])] as Par
      if (j.stats) {
        chutes = [...j.stats.chutes] as Par; noAlvo = [...j.stats.noAlvo] as Par; pp = [...j.stats.posse] as Par
        for (const e of j.eventos ?? []) {
          if (e.tipo === 'gol') { soma(e.a, e.lado, 3); soma(e.b, e.lado, 2) }
          else if (e.tipo === 'defesa' || e.tipo === 'encaixa') soma(e.a, e.lado, 1)
          else if (e.tipo === 'espalma') soma(e.a, e.lado, 1.5)
          else if (e.tipo === 'trave') soma(e.a, e.lado, 0.6)
          else if (e.tipo === 'chute' || e.tipo === 'cabeceio') soma(e.a, e.lado, 0.25)
          else if (e.tipo === 'drible') soma(e.a, e.lado, 0.4)
          else if (e.tipo === 'desarme' || e.tipo === 'carrinho') soma(e.a, e.lado, 0.35)
          else if (e.tipo === 'intercepta' || e.tipo === 'corte' || e.tipo === 'bloqueio') soma(e.a, e.lado, 0.2)
        }
      } else for (const l of j.lances ?? []) {
        const adv = (1 - l.lado) as 0 | 1
        if (l.tipo === 'chute') { chutes[l.lado]++; if (l.noAlvo) noAlvo[l.lado]++; soma(l.nome, l.lado, 0.25) }
        else if (l.tipo === 'gol') { soma(l.nome, l.lado, 3); soma(l.assist, l.lado, 2) }
        else if (l.tipo === 'defesa') soma(l.goleiro, adv, l.dificil ? 1.5 : 1)
        else if (l.tipo === 'trave') soma(l.nome, l.lado, 0.6)
      }
      // 🏆 quem ganhou leva um empurrãozinho (no empate, ninguém)
      const [a, b] = j.placar, venc = a > b ? 0 : b > a ? 1 : -1
      let craque: ResumoCampo2D['craque'] = null, melhor = 0.99
      for (const [nome, o] of pontos) { const p = o.p + (o.lado === venc ? 0.8 : 0); if (p > melhor) { melhor = p; craque = { nome, lado: o.lado } } }
      const tot = pp[0] + pp[1]
      const p0 = tot > 0 ? Math.round(pp[0] / tot * 100) : 50
      return { posse: [p0, 100 - p0], chutes, noAlvo, craque }
    },
  }
}

/** 😱 a frase do QUASE: sorteada por um número FIXO do lance (nunca pelo dado do jogo — sortear aqui mudaria a partida) */
export function fraseQuase(q: QuaseCampo2D, en: boolean): string {
  let h = 2166136261
  for (const ch of q.k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const r = ((h >>> 0) % 1000) / 1000
  return q.tipo === 'trave'
    ? frase('quase_trave', en, r, { a: q.nome || (en ? 'the striker' : 'o atacante') })
    : frase('quase_defesa', en, r, { a: q.goleiro || (en ? 'the keeper' : 'o goleiro') })
}
