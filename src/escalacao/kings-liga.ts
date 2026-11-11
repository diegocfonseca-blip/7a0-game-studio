// 👑 KINGS LEAGUE DENTRO DA TEMPORADA DE SEMPRE (15/10). Diego: *"tudo é padrão do nosso jogo… as regras são
// diferentes, mas tabela, jogos, placar"* — então a partida é a do jogo (`simMatch`: gols, autores, garçons) e
// AQUI só entra o que a Kings League Brasil muda por cima dela:
//  · ⚽ a bola cai da gaiola e começa 1×1 + goleiros, entra 1 por minuto até 7×7 (só tela)
//  · 🎩 pênalti do presidente: 1 por time, no minuto da AGENDA da rodada (igual em todos os jogos); quem é gente escolhe o
//    canto (ou pra onde pula) com contagem — não escolheu, sorteio
//  · 🃏 carta secreta SORTEADA pra cada time (ninguém escolhe), também no minuto da agenda
//  · 🎲 dado no 18' (👑 cara do rei = 1×1 · 2×2 · 3×3) — aviso na tela
//  · ⏱️ 38': empatado → 🟡 bola dourada (o próximo gol vence e acaba) · alguém na frente → 🔴 bola vermelha (gol vale 2)
//  · empate no apito → SHOOTOUT; pontos 3 (vitória) · 2 (vitória no shootout) · 1 (derrota no shootout) · 0
// A partida tem 40 min; o placar de sempre anda de 0 a 93, então os minutos são traduzidos pela proporção.
import type { AssistRow, CartaKingsInfo, CartaoKingsInfo, CartaKingsTipo, DueloKingsInfo, KingsBase, KingsInfo, LeagueTeam, MatchHighlight, MatchResult, ScorerRow } from './types'
import { MIN_DADO, MIN_DADO_FIM, MIN_GOL_DOBRO, MIN_MATCHBALL, MIN_INTERVALO, MIN_FIM, MIN_EFEITO as MIN_EFEITO_K, rngKings, dueloKings } from './kings'
import type { Canto } from './kings'
import { disputaPenaltisComSequencia } from './penaltis'

/** minuto da Kings (0–40) → minuto do placar de sempre (0–93) */
export const kParaPlacar = (k: number) => Math.round(k * 93 / MIN_FIM)
/** minuto do placar de sempre (0–93) → minuto da Kings (0–40) */
export const placarParaK = (m: number) => Math.max(0, Math.min(MIN_FIM, Math.round(m * MIN_FIM / 93)))
export const PLACAR_DADO = kParaPlacar(MIN_DADO)
export const PLACAR_INTERVALO = kParaPlacar(MIN_INTERVALO)
/** ⏱️ o minuto do match ball na escala do placar (o relógio da Kings para aqui) */
export const PLACAR_MB = kParaPlacar(MIN_MATCHBALL)
/** (regra antiga: a bola do 38' — só pra jogos já jogados) */
export const PLACAR_BOLA = kParaPlacar(38)
export const PLACAR_DADO_FIM = kParaPlacar(MIN_DADO_FIM)
/** ✖️2 17'–20': o 1º minuto do placar (0–93) que a tela já mostra como 17' (11/11: era o 40, que deixava o 39 = "17'" de fora) */
export const PLACAR_DOBRO_INI = Math.ceil((MIN_GOL_DOBRO - 0.5) * 93 / MIN_FIM)
/** o gol do minuto `m` (placar 0–93) cai na janela ✖️2? — pelo minuto da TELA: 17' a 20' */
export const naJanelaDoDobro = (m: number) => placarParaK(m) >= MIN_GOL_DOBRO && placarParaK(m) <= MIN_INTERVALO
/** o minuto da Kings que a TELA mostra: no match ball o relógio fica parado no 36' */
export const placarParaKTela = (m: number) => Math.min(MIN_MATCHBALL, placarParaK(m))

const ehGol = (h: MatchHighlight) => h.kind === 'gol'
/** chance de gol numa tentativa do shootout (1×1 saindo do meio, 5 s) */
export const SHOOTOUT_CONVERSAO = 0.55

/** tira 1 de quem está na lista (e a linha some no zero) */
function desconta<T extends { name: string; teamId: number }>(lista: T[], nome: string, teamId: number, campo: 'goals' | 'assists') {
  const i = lista.findIndex(x => x.name === nome && x.teamId === teamId)
  if (i < 0) return
  const row = lista[i] as unknown as Record<string, number>
  row[campo]--
  if (row[campo] <= 0) lista.splice(i, 1)
}

// ── ⚽ OS GOLS DA KINGS (15/10, Diego: *"você precisa entender melhor o jogo da Kings… onde sai mais gol, onde sai menos…
// muitas vezes sai gol no minuto 1 quando tá 1x1"*). A partida de sempre (`simMatch`) dá placar de futebol de 11 (2–3
// gols); a Kings de verdade dá ~7 por jogo (Copa do Mundo da Kings 2024: 407 gols em 55 jogos = 7,4; placares tipo 7×5,
// 8×4, 5×5). Então a Kings tem o PRÓPRIO sorteio de gols, minuto a minuto, pela quantidade de gente em campo:
//   · 1×1 do pontapé (0'–2', goleiro + 1, campo inteiro aberto): muito gol — e o GOLEIRO também marca
//   · escalonado (2×2 no 2' … 6×6 no 6'): vai caindo conforme entra gente
//   · 7×7: ritmo de futsal grande, bem menos
//   · fase do dado (👑 1×1 · 2×2 · 3×3): volta a chover gol
//   · reta final: todo mundo no ataque, sobe um pouco
// Placar médio de bola rolando ≈ 5,5 + presidente/cartas/bola do fim ≈ 7–8. Força do time (média dos 7 melhores) e
// tática mexem na chance. Autor e garçom saem do elenco DE VERDADE (carta de mentira faz o gol mas não entra na súmula).
export interface CartaGol { name: string; pos: string; lo: number; hi: number; fake?: boolean; club?: string }
// 🔁 11/11 (Diego: *"onde mais sai gol é do minuto 1 ao 4… e no dado quando cai 3x3, 2x2 também"*): 1×1 a 4×4 e o dado de 2×2/3×3 sobem.
// O resto fica como era — *"não quer dizer que não saia nos outros… na Kings costuma sair mais goleada, até empate de goleada"*.
const GOL_POR_MIN: Record<number, number> = { 1: 0.2, 2: 0.2, 3: 0.19, 4: 0.17, 5: 0.095, 6: 0.08, 7: 0.04 }
const GOL_RETA_FINAL = 0.055
/** quantos de linha cada time tem no minuto `k` da Kings */
export function emCampoKings(k: number, dado: 1 | 2 | 3): number {
  if (k < 2) return 1
  if (k < 7) return k
  if (k >= MIN_DADO && k < MIN_DADO_FIM) return dado
  return 7
}
/** o dado do jogo sai da MESMA semente da regra (`aplicaRegrasKings` sorteia ele primeiro) */
export const dadoDoJogo = (seed: number): 1 | 2 | 3 => FACES_DADO[Math.floor(rngKings(seed)() * 6)]
export const BOT_MENOS_KINGS = 1
const forcaDe = (elenco: CartaGol[]) => {
  const top = elenco.map(c => (c.lo + c.hi) / 2).sort((a, b) => b - a).slice(0, 7)
  return top.length ? top.reduce((a, b) => a + b, 0) / top.length : 60
}
export function simulaGolsKings(o: {
  homeId: number; awayId: number; nomes: { h: string; a: string }; seed: number
  elencos: { h: CartaGol[]; a: CartaGol[] }; taticas?: { h?: string; a?: string }; ehFake: (c: CartaGol) => boolean
  /** 🤖 time de BOT (sem dono): joga 1 ponto abaixo da força do elenco */ bot?: { h?: boolean; a?: boolean }
}): { highlights: MatchHighlight[]; tmpS: ScorerRow[]; tmpA: AssistRow[]; cartoes: CartaoKingsInfo[] } {
  const rng = rngKings(o.seed ^ 0x601A5)
  // 🎢 11/11: cada jogo tem o SEU ritmo (sorteio próprio, não mexe nos outros): uns mais travados, outros jogo louco — é daí que saem as
  // goleadas e os empates de goleada que a Kings tem. Entre 0,75× e 1,5× a chance de gol de todo minuto.
  const ritmo = 0.75 + 0.75 * rngKings(o.seed ^ 0x717A5)()
  // 🟨🟥 CARTÕES (15/10, Diego: *"o cartão amarelo, o jogador tem que esperar 2 minutos lá fora"*). Na Kings ninguém é
  // expulso de vez: amarelo = 2 min fora, vermelho = 5 min fora, e o time joga com UM A MENOS nesse tempo (marca menos,
  // leva mais). Só depois do 7×7 completo (no 1×1 não sobra ninguém pra tirar). Sorteio PRÓPRIO (`rc`), separado do gol.
  const rc = rngKings(o.seed ^ 0xCA27D)
  const cartoes: CartaoKingsInfo[] = []
  const foraAte: Record<'h' | 'a', number> = { h: -1, a: -1 }
  const pesoCartao = (c: CartaGol) => c.pos === 'ZAG' ? 3 : c.pos === 'LAT' ? 2.2 : c.pos === 'MEI' ? 2 : c.pos === 'ATA' ? 1.4 : 0
  const dado = dadoDoJogo(o.seed)
  // 🤖 11/11 (Diego: *"tô achando os bots muito fortes… deixe força média 78, caindo um ponto de 79"*): na Kings o bot joga com a força
  // do elenco MENOS 1 (medido: bots chegavam com 79 de média no leilão). Só a conta de quem é mais forte — o elenco e as cartas não mudam.
  const fH = forcaDe(o.elencos.h) - (o.bot?.h ? BOT_MENOS_KINGS : 0), fA = forcaDe(o.elencos.a) - (o.bot?.a ? BOT_MENOS_KINGS : 0)
  const tat = (t?: string) => t === 'ataque' ? [1.15, 1.12] : t === 'retranca' ? [0.85, 0.8] : [1, 1]
  const [hOwn, hGive] = tat(o.taticas?.h), [aOwn, aGive] = tat(o.taticas?.a)
  // ⚖️ 11/11 (Diego: *"o principal: ganha também com base em quem escolher melhor o time, igual normalmente com os outros modos"*): a força
  // pesava pouco (expoente 1,4, teto 1,9) — com diferença média o mais forte ganhava só 59% (no modo normal, 65%; diferença grande 79% × 96%).
  // Com expoente 4 e teto 2,6, medido em 1.350 jogos: diferença pequena 54% · média 69% · grande 96% — o mesmo do jogo normal.
  // (a SOMA dos dois fica como era: muda QUEM faz os gols, não quantos saem — senão a média passava de 10 por jogo)
  const pH = Math.min(2.6, Math.max(0.38, Math.pow(fH / fA, 4))), pA = Math.min(2.6, Math.max(0.38, Math.pow(fA / fH, 4)))
  const antigoH = Math.min(1.9, Math.max(0.45, Math.pow(fH / fA, 1.4))), antigoA = Math.min(1.9, Math.max(0.45, Math.pow(fA / fH, 1.4)))
  const igual = (antigoH + antigoA) / (pH + pA)
  const multH = pH * igual * hOwn * aGive
  const multA = pA * igual * aOwn * hGive
  const highlights: MatchHighlight[] = []
  const tmpS: ScorerRow[] = [], tmpA: AssistRow[] = []
  // "dia" de cada jogador (o craque pode apagar, o perna-de-pau pode brilhar), igual à partida de sempre
  const dia = new Map<string, number>()
  for (const c of [...o.elencos.h, ...o.elencos.a]) dia.set(c.name, 0.4 + rng() * 2.2)
  const nivel = (c: CartaGol) => 0.12 + Math.pow(Math.max(0, ((c.lo + c.hi) / 2 - 40) / 42), 2) * 1.8
  const sorteia = <T,>(itens: T[], peso: (x: T) => number): T | null => {
    const tot = itens.reduce((a, x) => a + peso(x), 0)
    if (tot <= 0) return null
    let r = rng() * tot
    for (const x of itens) { r -= peso(x); if (r <= 0) return x }
    return itens[itens.length - 1]
  }
  const credita = <R extends { name: string; teamId: number; teamName: string }>(lista: R[], nome: string, teamId: number, teamName: string, campo: 'goals' | 'assists') => {
    const row = lista.find(x => x.name === nome && x.teamId === teamId) as unknown as Record<string, number> | undefined
    if (row) row[campo]++
    else lista.push({ name: nome, teamId, teamName, [campo]: 1 } as unknown as R)
  }
  for (let k = 0; k < MIN_FIM; k++) {
    const n = emCampoKings(k, dado)
    const base = (k >= 36 ? GOL_RETA_FINAL : GOL_POR_MIN[n]) * ritmo
    // 🟨🟥 alguém tomou cartão neste minuto? (o time fica com um a menos a partir do minuto seguinte)
    if (k >= 7 && k < MIN_FIM - 1) for (const lado of ['h', 'a'] as const) {
      const r = rc(), r2 = rc(), r3 = rc()
      if (foraAte[lado] >= k) continue
      const cor = r < 0.013 ? 'amarelo' : r < 0.0145 ? 'vermelho' : null
      if (!cor) continue
      const quem = sorteiaCom(o.elencos[lado].filter(c => !o.ehFake(c)), pesoCartao, r2)
      if (!quem) continue
      const ate = Math.min(MIN_FIM, k + 1 + (cor === 'amarelo' ? 2 : 5))
      foraAte[lado] = ate - 1
      cartoes.push({ teamId: lado === 'h' ? o.homeId : o.awayId, nome: quem.name, cor, min: Math.max(1, Math.min(92, kParaPlacar(k) + Math.floor(r3 * kParaPlacar(1)))), ate })
    }
    for (const lado of ['h', 'a'] as const) {
      const sorteioGol = rng(), quando = rng()
      const meuFora = foraAte[lado] >= k, rivalFora = foraAte[lado === 'h' ? 'a' : 'h'] >= k
      const homem = (meuFora ? 0.7 : 1) * (rivalFora ? 1.35 : 1)
      if (sorteioGol >= base * homem * (lado === 'h' ? multH : multA)) continue
      const id = lado === 'h' ? o.homeId : o.awayId, time = lado === 'h' ? o.nomes.h : o.nomes.a
      const elenco = o.elencos[lado]
      const min = Math.max(1, Math.min(93, kParaPlacar(k) + Math.floor(quando * kParaPlacar(1))))
      // ⚽ quem fez: no 1×1/2×2 o goleiro joga junto e marca de vez em quando; depois é coisa de atacante
      const autor = sorteia(elenco, c => (c.pos === 'ATA' ? 6 : c.pos === 'MEI' ? 3 : c.pos === 'LAT' ? 1 : c.pos === 'ZAG' ? 0.8 : (n <= 2 ? 2.5 : 0.04)) * nivel(c) * (dia.get(c.name) ?? 1))
      if (!autor) { highlights.push({ min, text: `⚽ Gol de ${time}.`, teamId: id, kind: 'gol' }); continue }
      highlights.push({ min, text: `⚽ ${autor.name} marca para ${time}!`, teamId: id, kind: 'gol' })
      if (!o.ehFake(autor)) credita(tmpS, autor.name, id, time, 'goals')
      // 🅰️ o passe (no 1×1 quase sempre é jogada individual)
      if (rng() < (n <= 1 ? 0.15 : 0.62)) {
        const garcom = sorteia(elenco.filter(c => c.name !== autor.name), c => (c.pos === 'MEI' ? 4 : c.pos === 'ATA' ? 3 : c.pos === 'GOL' ? 0.6 : 1.5) * nivel(c))
        if (garcom) {
          highlights.push({ min, text: `🅰️ ${garcom.name} deu o passe para o gol de ${time}.`, teamId: id, kind: 'assist' })
          if (!o.ehFake(garcom)) credita(tmpA, garcom.name, id, time, 'assists')
        }
      }
    }
  }
  highlights.sort((x, y) => x.min - y.min)
  return { highlights, tmpS, tmpA, cartoes }
}
/** sorteio com peso e com o número já tirado (o cartão usa o rng próprio dele) */
function sorteiaCom<T>(itens: T[], peso: (x: T) => number, r: number): T | null {
  const tot = itens.reduce((a, x) => a + peso(x), 0)
  if (tot <= 0) return null
  let x = r * tot
  for (const it of itens) { x -= peso(it); if (x <= 0) return it }
  return itens[itens.length - 1]
}

// ── 🗓️ AGENDA DA RODADA (Diego 15/10): o pênalti do presidente e a carta caem no MESMO minuto em todos os jogos da
// rodada — um minuto pro time da CASA (1º tempo) e outro pro VISITANTE (2º tempo). Assim, no online, ninguém se atropela.
export interface AgendaKings { presCasa: number; cartaCasa: number; presFora: number; cartaFora: number }
const misturaSemente = (...n: number[]) => n.reduce((h, x) => Math.imul(h ^ (x | 0), 0x9E3779B1) >>> 0, 0x811C9DC5)
export function agendaKings(seed: number, rodada: number): AgendaKings {
  const r = rngKings(misturaSemente(seed, rodada, 0xA6E4DA))
  const presCasa = 5 + Math.floor(r() * 9)            // 5'–13'
  const cartaCasa = presCasa + 2 + Math.floor(r() * 3) // 2 a 4 min depois (≤ 17')
  const presFora = 23 + Math.floor(r() * 8)           // 23'–30'
  const cartaFora = presFora + 2 + Math.floor(r() * 3) // ≤ 34'
  return { presCasa, cartaCasa, presFora, cartaFora }
}
/** semente de UM jogo da Kings (mesma em todo aparelho) */
export const sementeJogoKings = (seed: number, rodada: number, homeId: number, awayId: number) => misturaSemente(seed, rodada, homeId, awayId, 0xC0DE)

// 🃏 as cartas da Kings League (página oficial "Como se joga" + regulamento PT de 14/10/2025). Sorteio puro: ninguém escolhe.
// 🔁 10/11: as 6 cartas que o Diego mandou (Gol 2× · Shootout · Jogador estrela · Pênalti · Coringa · Suspensão). O PÊNALTI INVERSO
// saiu da roleta (não está na lista dele, e ele já tinha dito que não entendia) — o tipo continua existindo pros jogos já jogados.
export const CARTAS_SORTEIO: CartaKingsTipo[] = ['penalti', 'shootout', 'suspensao', 'gol_dobro', 'estrela', 'coringa']
/** 🃏 10/11 (Diego: *"coringa vc escolhe a carta"*): no que o coringa pode virar (quem é gente escolhe; bot sorteia) */
export const OPCOES_CORINGA = CARTAS_SORTEIO.filter(c => c !== 'coringa') as Exclude<CartaKingsTipo, 'coringa'>[]
/** 🎲 as 6 faces do dado: duas de cada — 👑 cara do rei (1×1), 2×2, 3×3 */
export const FACES_DADO: (1 | 2 | 3)[] = [1, 1, 2, 2, 3, 3]
/** quanto duram a suspensão e o gol em dobro (min da Kings) */
const EFEITO_K = 4

export interface CtxKings {
  agenda: AgendaKings
  nomes: { h: string; a: string }
  /** ids dos times de GENTE (a escolha de canto deles vem de `base.decisoes`) */
  humanos: number[]
  /** o craque do time pra carta de jogador estrela */
  estrela: (teamId: number) => string | null
  /** os jogadores de LINHA do time (a suspensão sorteia um deles) */
  linha: (teamId: number) => string[]
}

/**
 * 👑 Aplica a regra da Kings por cima da partida de sempre. Recomeça SEMPRE da partida crua (`base`), então pode ser
 * chamada de novo quando a pessoa escolhe o canto: mesma semente + a escolha dela = a mesma partida, só com a cobrança
 * decidida por ela. Devolve a artilharia/garçons deste jogo (já sem os gols que a bola dourada anulou).
 */
export function aplicaRegrasKings(r: MatchResult, base: KingsBase, ctx: CtxKings): { s: ScorerRow[]; a: AssistRow[] } {
  const tmpS = base.tmpS.map(x => ({ ...x })), tmpA = base.tmpA.map(x => ({ ...x }))
  r.highlights = base.highlights.map(x => ({ ...x }))
  const rng = rngKings(base.seed)
  const H = r.homeId, A = r.awayId
  const nome = (id: number) => id === H ? ctx.nomes.h : ctx.nomes.a
  const rival = (id: number) => id === H ? A : H
  // ── todos os sorteios de uma vez, sempre na mesma ordem (a escolha de alguém nunca muda o resto do jogo)
  const dado = FACES_DADO[Math.floor(rng() * 6)] // ⚠️ 1º sorteio da semente — `dadoDoJogo` depende disto
  const sorteiaCarta = () => {
    const sorteada = CARTAS_SORTEIO[Math.floor(rng() * CARTAS_SORTEIO.length)]
    const outras = CARTAS_SORTEIO.filter(c => c !== 'coringa') as Exclude<CartaKingsTipo, 'coringa'>[]
    const sub = outras[Math.floor(rng() * outras.length)]
    return { sorteada, vale: sorteada === 'coringa' ? sub : sorteada }
  }
  const cartaH = sorteiaCarta(), cartaA = sorteiaCarta()
  // 🃏 CORINGA: quem é gente escolhe no que ele vira (`coringa:h|a`); sem escolha (ou bot), fica o sorteado acima
  for (const [c, lado, id] of [[cartaH, 'h', H], [cartaA, 'a', A]] as const) {
    const d = base.decisoes[`coringa:${lado}`]
    if (c.sorteada === 'coringa' && d != null && ctx.humanos.includes(id) && OPCOES_CORINGA[d]) c.vale = OPCOES_CORINGA[d]
  }
  const dados = () => ({ chute: Math.floor(rng() * 6), pulo: Math.floor(rng() * 6), sorte: rng(), sorte2: rng() })
  const dPresH = dados(), dPresA = dados(), dCartaH = dados(), dCartaA = dados()
  const suspH = { chance: rng(), quando: rng() }, suspA = { chance: rng(), quando: rng() }
  const posse = rng() < 0.5 ? H : A // ⚽ quem chega primeiro na bola que caiu da gaiola
  const quemSaiH = rng(), quemSaiA = rng() // 🟥 qual jogador do rival a suspensão tira
  const gols: MatchHighlight[] = []
  const duelos: DueloKingsInfo[] = []
  // ── 🥅 uma cobrança 1×1: quem é gente escolhe (batedor = canto do chute · goleiro = pra onde pula); quem não escolheu, sorteio
  const duelo = (key: string, tipo: DueloKingsInfo['tipo'], kMin: number, batedor: number, d: ReturnType<typeof dados>) => {
    const goleiro = rival(batedor)
    const dec = base.decisoes[key]
    const chute = dec != null && ctx.humanos.includes(batedor) ? dec : d.chute
    const pulo = dec != null && ctx.humanos.includes(goleiro) && !ctx.humanos.includes(batedor) ? dec : d.pulo
    let gol = dueloKings(chute as Canto, pulo as Canto, d.sorte)
    if (tipo === 'shootout') gol = gol && d.sorte2 < 0.72 // sai do meio, 5 s: entra menos que pênalti
    const golPara = tipo === 'penalti_inverso' ? (gol ? null : goleiro) : (gol ? batedor : null)
    const min = kParaPlacar(kMin)
    duelos.push({ key, tipo, min, batedor, goleiro, chute, pulo, gol, golPara })
    if (golPara != null) {
      const texto = tipo === 'presidente' ? `🎩 PÊNALTI DO PRESIDENTE! Gol do ${nome(golPara)}!`
        : tipo === 'penalti' ? `🃏 PÊNALTI DA CARTA! Gol do ${nome(golPara)}!`
        : tipo === 'shootout' ? `🃏 SHOOTOUT DA CARTA! Gol do ${nome(golPara)}!`
        : `🔄 PÊNALTI INVERSO! O ${nome(batedor)} errou — gol do ${nome(golPara)}!`
      // o gol entra no placar 1 tique DEPOIS do minuto da cobrança: o relógio para no minuto dela e o placar não pode
      // entregar o resultado antes de a bola sair (anti-spoiler)
      gols.push({ min: min + 1, text: texto, teamId: golPara, kind: 'gol' })
    }
  }
  const ag = ctx.agenda
  duelo('pres:h', 'presidente', ag.presCasa, H, dPresH)
  duelo('pres:a', 'presidente', ag.presFora, A, dPresA)
  // 🃏 as cartas
  const cartas: CartaKingsInfo[] = []
  const usaCarta = (teamId: number, kMin: number, c: ReturnType<typeof sorteiaCarta>, d: ReturnType<typeof dados>, susp: { chance: number; quando: number }, lado: 'h' | 'a', quemSai: number) => {
    const info: CartaKingsInfo = { teamId, min: kParaPlacar(kMin), sorteada: c.sorteada, vale: c.vale }
    // 🟥 SUSPENSÃO (10/11, Diego: *"1 jogador a sua escolha por 4 min"*): quem é gente escolhe QUEM do rival sai (`susp:h|a`); bot sorteia
    if (c.vale === 'suspensao') { const l = ctx.linha(rival(teamId)), d = base.decisoes[`susp:${lado}`]; if (l.length) info.suspenso = l[d != null && ctx.humanos.includes(teamId) && d < l.length ? d : Math.floor(quemSai * l.length)] }
    if (c.vale === 'penalti' || c.vale === 'shootout') duelo(`carta:${lado}`, c.vale, kMin, teamId, d)
    else if (c.vale === 'penalti_inverso') duelo(`carta:${lado}`, 'penalti_inverso', kMin, rival(teamId), d)
    else if (c.vale === 'suspensao' && susp.chance < 0.45) {
      // 🟥 um rival fica 4 min fora: com um a mais, o time aproveita (às vezes)
      gols.push({ min: kParaPlacar(kMin + 1 + Math.floor(susp.quando * (EFEITO_K - 1))), text: `🟥 Com um a mais, o ${nome(teamId)} aproveita: GOL!`, teamId, kind: 'gol' })
    } else if (c.vale === 'estrela') info.estrela = ctx.estrela(teamId) ?? undefined
    cartas.push(info)
  }
  usaCarta(H, ag.cartaCasa, cartaH, dCartaH, suspH, 'h', quemSaiH)
  usaCarta(A, ag.cartaFora, cartaA, dCartaA, suspA, 'a', quemSaiA)
  r.highlights.push(...gols)
  r.highlights.sort((x, y) => x.min - y.min)
  // ✖️2 / ⭐ gols que valem 2 (entra um 2º lance no mesmo minuto — o placar de sempre conta lance a lance)
  const dobrados = new Set<MatchHighlight>()
  for (const c of cartas) {
    if (c.vale === 'gol_dobro') {
      // 🐛 11/11 (Diego: *"às vezes o gol dobrado não tá contando"*): a janela é contada no MINUTO DA TELA (o da Kings, 0–40), não no
      // do placar (0–93) — o arredondamento deixava gol que a tela mostrava dentro dos 4 min de fora do dobro
      const k0 = placarParaK(c.min)
      for (const g of r.highlights.filter(h => ehGol(h) && h.teamId === c.teamId && h.min >= c.min && placarParaK(h.min) <= k0 + EFEITO_K)) dobrados.add(g)
    } else if (c.vale === 'estrela' && c.estrela) {
      // ⭐ 10/11 (Diego: *"jogador estrela o gol dele vale 2 no jogo normal"*): TODO gol dele vale 2, da carta até o 36' (no match ball, não)
      for (const g of r.highlights.filter(h => ehGol(h) && h.teamId === c.teamId && h.min >= c.min && h.min <= PLACAR_MB && h.text.startsWith(`⚽ ${c.estrela} marca para`))) dobrados.add(g)
    }
  }
  for (const g of dobrados) {
    const estrela = cartas.some(c => c.vale === 'estrela' && c.teamId === g.teamId && c.estrela && g.text.startsWith(`⚽ ${c.estrela} `))
    r.highlights.push({ min: g.min, text: estrela ? '⭐ JOGADOR ESTRELA: esse gol vale 2!' : '✖️2 GOL EM DOBRO: esse gol vale 2!', teamId: g.teamId, kind: 'gol' })
  }
  r.highlights.sort((x, y) => x.min - y.min)
  // ✖️2 do 17' ao 20' TODO gol vale 2, dos dois times (o que já vale 2 pela carta não dobra de novo)
  const extra = /^(✖️2|⭐|🔴)/
  // 🐛 11/11: pelo minuto que a TELA mostra — todo gol que aparece como 17', 18', 19' ou 20' vale 2 (antes um 17' e um 20' ficavam de fora)
  for (const g of r.highlights.filter(h => ehGol(h) && !extra.test(h.text) && naJanelaDoDobro(h.min)))
    if (!dobrados.has(g)) { dobrados.add(g); r.highlights.push({ min: g.min, text: '✖️2 DO 17\' AO 20\': esse gol vale 2!', teamId: g.teamId, kind: 'gol' }) }
  r.highlights.sort((x, y) => x.min - y.min)
  // ⏱️ MATCH BALL no 36': o relógio para. Empatado → shootout (nada depois do 36' vale). Alguém na frente → vence quem chegar
  // primeiro a (líder + 1): o gol que decide acaba o jogo e o que viria depois não existiu (sai do placar e da artilharia).
  const antes = r.highlights.filter(h => ehGol(h) && h.min <= PLACAR_MB)
  const h0 = antes.filter(h => h.teamId === H).length, a0 = antes.length - h0
  const tira = (desde: number, fica: Set<MatchHighlight>) => {
    for (const g of [...r.highlights]) {
      if (g.min <= desde || fica.has(g)) continue
      r.highlights.splice(r.highlights.indexOf(g), 1)
      const autor = /^⚽ (.+) marca para /.exec(g.text)?.[1]
      if (autor) desconta(tmpS, autor, g.teamId, 'goals')
      const garcom = /^🅰️ (.+) deu o passe/.exec(g.text)?.[1]
      if (garcom) desconta(tmpA, garcom, g.teamId, 'assists')
    }
  }
  let mb: NonNullable<KingsInfo['mb']>
  if (h0 === a0) { tira(PLACAR_MB, new Set()); mb = { empate: true, fim: PLACAR_MB } }
  else {
    const alvo = Math.max(h0, a0) + 1
    let h = h0, a = a0, decide: MatchHighlight | null = null
    for (const g of r.highlights.filter(x => ehGol(x) && x.min > PLACAR_MB && !extra.test(x.text))) {
      if (g.teamId === H) h++; else a++
      if (h >= alvo || a >= alvo) { decide = g; break }
    }
    if (!decide) {
      // ninguém chegou a tempo: o match ball segue até sair o gol — e quem está na frente precisa de UM só, então é ele que fecha
      const lider = h > a ? H : A
      const min = Math.min(93, Math.max(PLACAR_MB + 1, ...r.highlights.filter(x => x.min > PLACAR_MB).map(x => x.min)) + 1)
      decide = { min, text: `⚽ Gol de ${nome(lider)}.`, teamId: lider, kind: 'gol' }
      r.highlights.push(decide)
    }
    r.highlights.sort((x, y) => x.min - y.min)
    // o que vem DEPOIS do gol que decide (pela ordem dos lances, não pelo minuto) não existiu — e os "vale 2" das cartas
    // depois do 36' também não valem (no match ball é corrida até líder + 1)
    const idx = r.highlights.indexOf(decide!)
    const passe = r.highlights.slice(idx + 1).find(x => x.kind === 'assist' && x.min === decide!.min && x.teamId === decide!.teamId)
    const sai = r.highlights.filter((x, k) => (k > idx && x !== passe) || (x.min > PLACAR_MB && extra.test(x.text)))
    for (const g of sai) {
      r.highlights.splice(r.highlights.indexOf(g), 1)
      const autor = /^⚽ (.+) marca para /.exec(g.text)?.[1]
      if (autor) desconta(tmpS, autor, g.teamId, 'goals')
      const garcom = /^🅰️ (.+) deu o passe/.exec(g.text)?.[1]
      if (garcom) desconta(tmpA, garcom, g.teamId, 'assists')
    }
    decide!.text = `⏱️ MATCH BALL! ${decide!.text.replace(/^⚽ /, '')}`
    mb = { empate: false, alvo, fim: decide!.min }
  }
  r.highlights.sort((x, y) => x.min - y.min)
  r.hg = r.highlights.filter(h => ehGol(h) && h.teamId === H).length
  r.ag = r.highlights.filter(h => ehGol(h) && h.teamId === A).length
  const info: KingsInfo = { dado, posse, ouro: false, mb, pres: duelos.filter(d => d.tipo === 'presidente').map(d => ({ teamId: d.batedor, min: d.min, gol: d.gol })), cartas, duelos }
  if (r.hg === r.ag) {
    // 🥅 SHOOTOUT da Kings (regra oficial): 5 por time, cada um sai do MEIO-CAMPO cara a cara com o goleiro e tem 5 s pra
    // chutar; acaba antes se um não alcança mais; empatou nas 5, morte súbita. Entra bem menos que pênalti (~55%).
    const sh = disputaPenaltisComSequencia(rngKings(base.seed ^ 0x5400700), SHOOTOUT_CONVERSAO)
    info.pens = sh.gols; info.pensSeq = sh.seq
  }
  r.kings = info
  return { s: tmpS, a: tmpA }
}

/** desfaz o que `aplicaResultadoKings` pôs na tabela (quando a partida é refeita com a escolha da pessoa) */
export function desfazResultadoKings(league: LeagueTeam[], r: MatchResult) {
  const h = league.find(t => t.id === r.homeId), a = league.find(t => t.id === r.awayId)
  if (!h || !a) return
  h.gf -= r.hg; h.ga -= r.ag; a.gf -= r.ag; a.ga -= r.hg
  if (r.hg > r.ag) { h.pts -= 3; h.w--; a.l-- }
  else if (r.hg < r.ag) { a.pts -= 3; a.w--; h.l-- }
  else {
    const [ph, pa] = r.kings?.pens ?? [1, 0]
    h.d--; a.d--
    if (ph > pa) { h.pts -= 2; a.pts -= 1 } else { a.pts -= 2; h.pts -= 1 }
  }
}
/** tira das listas da competição o que um jogo tinha posto (artilharia/garçons) */
export function tiraListas(destS: ScorerRow[], art: { s: ScorerRow[]; a: AssistRow[] }, destA: AssistRow[]) {
  for (const x of art.s) for (let i = 0; i < x.goals; i++) desconta(destS, x.name, x.teamId, 'goals')
  for (const x of art.a) for (let i = 0; i < x.assists; i++) desconta(destA, x.name, x.teamId, 'assists')
}

/** pontos da Kings: 3 · 2 (vence no shootout) · 1 (perde no shootout) · 0. Na tabela, `d` conta os jogos de shootout. */
export function aplicaResultadoKings(league: LeagueTeam[], r: MatchResult) {
  const h = league.find(t => t.id === r.homeId), a = league.find(t => t.id === r.awayId)
  if (!h || !a) return
  h.gf += r.hg; h.ga += r.ag; a.gf += r.ag; a.ga += r.hg
  if (r.hg > r.ag) { h.pts += 3; h.w++; a.l++ }
  else if (r.hg < r.ag) { a.pts += 3; a.w++; h.l++ }
  else {
    const [ph, pa] = r.kings?.pens ?? [1, 0]
    h.d++; a.d++
    if (ph > pa) { h.pts += 2; a.pts += 1 } else { a.pts += 2; h.pts += 1 }
  }
}

/** quem venceu (id), contando o shootout */
export function vencedorKings(r: { homeId: number; awayId: number; hg: number; ag: number; kings?: KingsInfo }): number {
  if (r.hg !== r.ag) return r.hg > r.ag ? r.homeId : r.awayId
  const [ph, pa] = r.kings?.pens ?? [1, 0]
  return ph > pa ? r.homeId : r.awayId
}

/** soma a artilharia/garçons de um jogo da Kings (listas à parte) na lista da competição */
export function somaListas(destS: ScorerRow[], tmpS: ScorerRow[], destA: AssistRow[], tmpA: AssistRow[]) {
  for (const x of tmpS) { const row = destS.find(y => y.name === x.name && y.teamId === x.teamId); if (row) row.goals += x.goals; else destS.push({ ...x }) }
  for (const x of tmpA) { const row = destA.find(y => y.name === x.name && y.teamId === x.teamId); if (row) row.assists += x.assists; else destA.push({ ...x }) }
}

/** 👑 o que o campinho precisa saber da partida da Kings (tudo já sorteado pela regra — aqui só se mostra) */
export interface Kings2D {
  /** ⚽ quem pegou a bola da gaiola: 0 = casa · 1 = fora */
  posse?: 0 | 1
  dado: 1 | 2 | 3
  /** 🟡 o brilho do fim: no MATCH BALL (36', alguém na frente) é dourado · regra antiga: 🔴/🟡 a partir do 38' */
  bola?: 'dourada' | 'vermelha'
  /** regra nova (10/11): o brilho entra no 36' (match ball), não no 38' */
  matchBall?: boolean
  /** quem está FORA (cartão ou carta de suspensão): `min` no relógio do placar (0–93), `ate` = minuto da KINGS (0–40) em que volta */
  fora: { nome: string; min: number; ate: number; cor: 'amarelo' | 'vermelho' }[]
}
/** 👑📺 a partida da Kings → o que o Campo 2D desenha (cartões e a carta de suspensão viram "fora"; o dado e a bola do fim) */
export function kings2DDe(k?: KingsInfo | null, homeId?: number): Kings2D | undefined {
  if (!k) return undefined
  const fora: Kings2D['fora'] = (k.cartoes ?? []).map(c => ({ nome: c.nome, min: c.min, ate: c.ate, cor: c.cor }))
  for (const c of k.cartas ?? []) if (c.vale === 'suspensao' && c.suspenso) fora.push({ nome: c.suspenso, min: c.min, ate: placarParaK(c.min) + MIN_EFEITO_K, cor: 'vermelho' })
  // ⚽ 11/11 (Diego: *"a bola do início que cai pra alguém pegar deve ser aleatório quem fica com a bola"*): o campinho começa com quem a
  // regra sorteou (`posse`), o mesmo da cena do pontapé — antes o 2D sempre dava a saída pra casa
  const posse = homeId != null && k.posse != null ? (k.posse === homeId ? 0 : 1) : undefined
  return { dado: k.dado, bola: k.mb ? (k.mb.empate ? undefined : 'dourada') : k.bola, matchBall: !!k.mb, fora, posse }
}
