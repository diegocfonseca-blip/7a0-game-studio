// ─── 📰 O MARTELO DA CENTRAL — as notícias do meio da temporada (03/10) ──────
//
// A Central Legends (a "home" do modo carreira) tem um jornal que sai TODA rodada,
// não só no fim da temporada. Este arquivo é só a REDAÇÃO: recebe números que a
// tela já tem (tabela, artilheiros, elencos, forma recente) e devolve manchete +
// notícias. Sem estado, sem React, sem sorteio — a mesma entrada dá a mesma edição,
// por isso dá pra testar fora do navegador (`npm run central`).
//
// Regras da casa que valem aqui:
//  · 🙈 ANTI-SPOILER: quem chama só passa a rodada JÁ REVELADA. Nada aqui olha pro
//    futuro, porque nada aqui simula — só lê o que foi passado.
//  · 🚫 NADA INVENTADO: toda frase sai de um número real (pontos, sequência, gols,
//    preço). Nenhuma "declaração" de gente de verdade; a "diretoria" que fala é a
//    do clube fictício, como no jornal de fim de temporada.
//  · 🌐 PT e EN juntos, na mesma notícia.
//  · Nome de jogador e de clube NUNCA se traduz.

export type TimeLinha = { name: string; pts: number; w: number; d: number; l: number; gf: number; ga: number; you: boolean; human: boolean }
/** forma recente por clube: 'VVEVD' (a mais recente por ÚLTIMO) — só das rodadas já reveladas */
export type Formas = Record<string, string>
export type Artilheiro = { name: string; teamName: string; goals: number; you: boolean }
export type Garcom = { name: string; teamName: string; assists: number; you: boolean }
export type Contratacao = { name: string; teamName: string; paid: number; you: boolean }
export type EntradaJornal = {
  round: number
  divName: string
  divNameEn: string
  /** a tabela da SUA divisão, já ordenada */
  tabela: TimeLinha[]
  formas: Formas
  /** artilheiros e garçons da sua divisão, já ordenados */
  artilheiros: Artilheiro[]
  garcons: Garcom[]
  /** a carta mais cara entre os clubes da sua divisão */
  maisCaro: Contratacao | null
  /** suas compras desta temporada (do extrato) */
  compras: { name: string; paid: number }[]
  /** 💰 o maior lance do pregão desta temporada, de qualquer clube */
  maiorLance?: Contratacao | null
  /** 🌎 Libertadores: aberta nesta carreira? você está na Série A? no G8? quantos pontos faltam pro 8º */
  intl: { aberta: boolean; serieA: boolean; g8: boolean; faltam: number } | null
  /** uma OUTRA divisão pra variar o noticiário */
  outraDiv: { divName: string; divNameEn: string; lider: string; pts: number } | null
  /** rodadas da liga (38) e se a divisão rebaixa (a Várzea não tem pra onde cair) */
  totalRodadas?: number
  temRebaixamento?: boolean
  /** 🩹 titular SEU fora de combate (lesão/expulsão/noitada) e em quantos jogos volta */
  lesao?: { nome: string; jogosFora: number; motivo: [string, string] } | null
  /** 🌱 cria da base escalado de titular no próximo jogo */
  criaTitular?: string | null
  /** 🏆 copas chegando: faltam N rodadas · é na próxima temporada · é nesta temporada */
  copaChegando?: { nome: [string, string]; rodadasFaltam?: number; proximaTemporada?: boolean; esteAno?: boolean }[]
}
export type Noticia = { emoji: string; pt: string; en: string; tag: [string, string] }
export type Jornal = { manchete: { pt: string; en: string; sub: [string, string] } | null; noticias: Noticia[] }

const ord = (n: number) => `${n}º`
const ordEn = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`
/** quantas vezes seguidas, do fim pro começo, a forma termina em `c` */
export const sequencia = (forma: string | undefined, c: 'V' | 'E' | 'D'): number => {
  if (!forma) return 0
  let n = 0
  for (let i = forma.length - 1; i >= 0 && forma[i] === c; i--) n++
  return n
}
/** jogos sem perder / sem vencer, do fim pro começo */
const semPerder = (f?: string) => { if (!f) return 0; let n = 0; for (let i = f.length - 1; i >= 0 && f[i] !== 'D'; i--) n++; return n }
const semVencer = (f?: string) => { if (!f) return 0; let n = 0; for (let i = f.length - 1; i >= 0 && f[i] !== 'V'; i--) n++; return n }

export function redacaoDaCentral(e: EntradaJornal): Jornal {
  // 🥇 ORDEM POR IMPORTÂNCIA, não por tipo (03/10): com teto de 7, o que é do SEU clube
  // (título/Z4, lesão, cria, copa chegando) vem antes do noticiário geral — senão a lesão
  // do seu titular ficava de fora e sobrava "Série B: fulano lidera".
  const fila: { pri: number; n: Noticia }[] = []
  const noticias = { push: (n: Noticia, pri = 5) => { fila.push({ pri, n }) } }
  const t = e.tabela
  if (!t.length || e.round < 1) return { manchete: null, noticias: [] }
  const lider = t[0], vice = t[1]
  const euIdx = t.findIndex(x => x.you)
  const eu = euIdx >= 0 ? t[euIdx] : null
  const posDe = (name: string) => t.findIndex(x => x.name === name) + 1

  // ── 📰 MANCHETE: sempre sobre o topo da tabela ────────────────────────────
  const gap = vice ? lider.pts - vice.pts : 0
  const seqLider = sequencia(e.formas[lider.name], 'V')
  let manchete: Jornal['manchete']
  if (seqLider >= 3 && gap >= 2) manchete = {
    pt: `${lider.name} dispara: ${seqLider} vitórias seguidas e ${gap} ponto${gap > 1 ? 's' : ''} na frente`,
    en: `${lider.name} pull away: ${seqLider} wins in a row and ${gap} point${gap > 1 ? 's' : ''} clear`,
    sub: ['', ''],
  }
  else if (gap >= 4) manchete = { pt: `${lider.name} abre ${gap} pontos na liderança da ${e.divName}`, en: `${lider.name} open a ${gap}-point lead in ${e.divNameEn}`, sub: ['', ''] }
  else if (vice && gap === 0) manchete = { pt: `Briga no topo: ${lider.name} e ${vice.name} empatados com ${lider.pts} pontos`, en: `Title race: ${lider.name} and ${vice.name} level on ${lider.pts} points`, sub: ['', ''] }
  else manchete = { pt: `${lider.name} lidera a ${e.divName} com ${lider.pts} pontos${vice ? `; ${vice.name} vem ${gap} atrás` : ''}`, en: `${lider.name} lead ${e.divNameEn} on ${lider.pts} points${vice ? `; ${vice.name} ${gap} behind` : ''}`, sub: ['', ''] }
  if (eu) {
    const atras = lider.pts - eu.pts
    manchete.sub = eu.you && euIdx === 0
      ? ['Você é o líder — agora é segurar.', 'You are top — now hold on.']
      : atras <= 6 ? [`Você está em ${ord(euIdx + 1)}, a ${atras} ponto${atras === 1 ? '' : 's'} do líder.`, `You are ${ordEn(euIdx + 1)}, ${atras} point${atras === 1 ? '' : 's'} off the top.`]
      : [`Você está em ${ord(euIdx + 1)} com ${eu.pts} pontos.`, `You are ${ordEn(euIdx + 1)} on ${eu.pts} points.`]
  }

  // ── 🏆🚨 MATEMÁTICA DA TABELA: título e Z4 (Diego 03/10: *"faz Z4 e títulos"*) ─────
  // conta só com pontos possíveis (3 por rodada que falta) — nada de chute.
  const rest = Math.max(0, (e.totalRodadas ?? 38) - e.round)
  if (eu && t.length >= 10) {
    const z4 = t.length - 4 // índice da 1ª vaga do Z4
    if (euIdx === 0 && vice) {
      const precisa = vice.pts + rest * 3 + 1 - eu.pts
      if (precisa <= 0) noticias.push({ emoji: '🏆', pt: `TÍTULO MATEMÁTICO: ninguém mais alcança você na ${e.divName}. Pode comemorar.`, en: `CHAMPIONS, MATHEMATICALLY: nobody can catch you in ${e.divNameEn}. Celebrate.`, tag: ['título', 'title'] }, 0)
      else if (rest <= 10 && precisa <= rest * 3) noticias.push({ emoji: '🏆', pt: `Título à vista: faltam ${precisa} ponto${precisa === 1 ? '' : 's'} pra garantir a ${e.divName}, com ${rest} rodada${rest === 1 ? '' : 's'} pela frente.`, en: `Title in sight: ${precisa} point${precisa === 1 ? '' : 's'} to clinch ${e.divNameEn}, with ${rest} round${rest === 1 ? '' : 's'} to go.`, tag: ['título', 'title'] }, 0)
    } else if (e.temRebaixamento !== false && e.round >= 5) {
      const seguro = t[z4 - 1] // o último fora do Z4
      const primeiroZ4 = t[z4]
      if (euIdx >= z4) {
        const salva = seguro.pts + rest * 3 + 1 - eu.pts
        if (eu.pts + rest * 3 < seguro.pts) noticias.push({ emoji: '🪂', pt: `Rebaixamento confirmado: a conta não fecha mais na ${e.divName}. Agora é planejar a volta.`, en: `Relegation confirmed: the maths no longer works in ${e.divNameEn}. Time to plan the comeback.`, tag: ['z4', 'drop zone'] }, 0)
        else noticias.push({ emoji: '🚨', pt: `Você está no Z4, a ${seguro.pts - eu.pts} ponto${seguro.pts - eu.pts === 1 ? '' : 's'} do ${ord(z4)} — ${rest} rodada${rest === 1 ? '' : 's'} pra escapar${salva > 0 && salva <= rest * 3 ? ` (precisa de ${salva} pra se garantir)` : ''}.`, en: `You are in the drop zone, ${seguro.pts - eu.pts} point${seguro.pts - eu.pts === 1 ? '' : 's'} behind ${ordEn(z4)} — ${rest} round${rest === 1 ? '' : 's'} to escape${salva > 0 && salva <= rest * 3 ? ` (${salva} needed to be safe)` : ''}.`, tag: ['z4', 'drop zone'] }, 0)
      } else if (primeiroZ4 && eu.pts - primeiroZ4.pts <= 3) {
        noticias.push({ emoji: '⚠️', pt: `Z4 na cola: só ${eu.pts - primeiroZ4.pts} ponto${eu.pts - primeiroZ4.pts === 1 ? '' : 's'} separam você da zona de rebaixamento.`, en: `Drop zone breathing down your neck: just ${eu.pts - primeiroZ4.pts} point${eu.pts - primeiroZ4.pts === 1 ? '' : 's'} clear of relegation.`, tag: ['z4', 'drop zone'] }, 0)
      }
    }
  }
  // ── ⚽ artilharia ─────────────────────────────────────────────────────────
  const a1 = e.artilheiros[0], a2 = e.artilheiros[1]
  if (a1 && a1.goals > 0) {
    if (a1.you) noticias.push({ emoji: '⚽', pt: `Seu ${a1.name} é o artilheiro da ${e.divName} com ${a1.goals} gol${a1.goals > 1 ? 's' : ''}${a2 ? ` — ${a2.name} (${a2.teamName}) tem ${a2.goals}` : ''}.`, en: `Your ${a1.name} is ${e.divNameEn}'s top scorer with ${a1.goals} goal${a1.goals > 1 ? 's' : ''}${a2 ? ` — ${a2.name} (${a2.teamName}) has ${a2.goals}` : ''}.`, tag: ['artilharia', 'top scorers'] }, 3)
    else if (a2 && a1.goals - a2.goals <= 2 && a2.goals > 0) noticias.push({ emoji: '⚽', pt: `${a2.name} chega a ${a2.goals} gols e encosta no artilheiro ${a1.name} (${a1.goals}).`, en: `${a2.name} reaches ${a2.goals} goals and closes in on top scorer ${a1.name} (${a1.goals}).`, tag: ['artilharia', 'top scorers'] }, 3)
    else noticias.push({ emoji: '⚽', pt: `${a1.name} (${a1.teamName}) lidera a artilharia da ${e.divName} com ${a1.goals} gol${a1.goals > 1 ? 's' : ''}.`, en: `${a1.name} (${a1.teamName}) leads ${e.divNameEn}'s scoring charts with ${a1.goals} goal${a1.goals > 1 ? 's' : ''}.`, tag: ['artilharia', 'top scorers'] }, 3)
  }
  // ── 🅰️ garçons (o que vale pro gol vale pra assistência — regra de 19/09) ──
  const g1 = e.garcons[0], g2 = e.garcons[1]
  if (g1 && g1.assists > 0) {
    const isolado = !g2 || g1.assists - g2.assists >= 2
    noticias.push({ emoji: '🅰️', pt: `${g1.you ? 'Seu ' : ''}${g1.name} já tem ${g1.assists} assistência${g1.assists > 1 ? 's' : ''}${isolado ? ' — líder isolado dos garçons' : ` e divide o topo dos garçons com ${g2!.name}`}.`, en: `${g1.you ? 'Your ' : ''}${g1.name} already has ${g1.assists} assist${g1.assists > 1 ? 's' : ''}${isolado ? ' — clear leader among playmakers' : ` and shares the playmaker lead with ${g2!.name}`}.`, tag: ['garçons', 'assists'] }, 6)
  }
  // ── 💰 o maior lance do pregão (todo clube) ───────────────────────────────
  if (e.maiorLance && e.maiorLance.paid > 0) {
    const m = e.maiorLance, pos = posDe(m.teamName)
    noticias.push({ emoji: '💰', pt: `Maior lance da temporada: ${m.you ? 'você levou' : `${m.teamName} levou`} ${m.name} por 🪙 ${m.paid}${pos > 0 && !m.you ? ` — e está em ${ord(pos)}` : ''}.`, en: `Biggest bid of the season: ${m.you ? 'you took' : `${m.teamName} took`} ${m.name} for 🪙 ${m.paid}${pos > 0 && !m.you ? ` — and sit ${ordEn(pos)}` : ''}.`, tag: ['mercado', 'market'] }, 4)
  }
  // ── 💸 mercado ────────────────────────────────────────────────────────────
  if (e.maisCaro && e.maisCaro.paid > 0 && !(e.maiorLance && e.maiorLance.name === e.maisCaro.name)) {
    const m = e.maisCaro, pos = posDe(m.teamName)
    const ruim = pos > 0 && pos > Math.ceil(t.length / 2)
    noticias.push({ emoji: '💸', pt: `${m.name} é o jogador mais caro da ${e.divName} (🪙 ${m.paid}, ${m.you ? 'do seu clube' : m.teamName})${ruim ? ` — e o clube está só em ${ord(pos)}. Vai ter que render.` : '.'}`, en: `${m.name} is ${e.divNameEn}'s priciest player (🪙 ${m.paid}, ${m.you ? 'your club' : m.teamName})${ruim ? ` — and the club sits only ${ordEn(pos)}. Time to deliver.` : '.'}`, tag: ['mercado', 'market'] }, 8)
  }
  // ── 😰 crise: quem mais perde seguido (3+) ───────────────────────────────
  const crise = t.map(x => ({ x, n: sequencia(e.formas[x.name], 'D') })).filter(c => c.n >= 3).sort((a, b) => b.n - a.n)[0]
  if (crise) {
    const { x, n } = crise
    noticias.push(x.you
      ? { emoji: '😰', pt: `Você perde a ${n}ª seguida — a torcida cobra, e a tabela não espera.`, en: `You lose your ${ordEn(n)} in a row — the fans want answers, and the table won't wait.`, tag: ['seu clube', 'your club'] }
      : { emoji: '😰', pt: `${x.name} perde a ${n}ª seguida; a diretoria fala em "reformulação".`, en: `${x.name} lose their ${ordEn(n)} in a row; the board talks of a "rebuild".`, tag: ['crise', 'crisis'] }, 5)
  }
  // ── 🔥 embalado: quem vem de 3+ vitórias (fora o líder, que já é manchete) ──
  const embalado = t.filter(x => x !== lider).map(x => ({ x, n: sequencia(e.formas[x.name], 'V') })).filter(c => c.n >= 3).sort((a, b) => b.n - a.n)[0]
  if (embalado && !embalado.x.you) {
    const { x, n } = embalado
    noticias.push({ emoji: '🔥', pt: `${x.name} embala: ${n} vitórias seguidas e já aparece em ${ord(posDe(x.name))}.`, en: `${x.name} are rolling: ${n} straight wins and up to ${ordEn(posDe(x.name))}.`, tag: ['embalado', 'on fire'] }, 7)
  }
  // ── 🏠 seu clube: Libertadores (G8) ou a sua sequência ───────────────────
  if (eu) {
    const f = e.formas[eu.name]
    if (e.intl?.aberta && e.intl.serieA) {
      noticias.push(e.intl.g8
        ? { emoji: '🌎', pt: `G8 na mão: você está em ${ord(euIdx + 1)} — vaga na Libertadores se a tabela acabar assim.`, en: `Top 8 in hand: you are ${ordEn(euIdx + 1)} — a Libertadores spot if the table ends like this.`, tag: ['seu clube', 'your club'] }
        : { emoji: '🌎', pt: `G8 em jogo: faltam ${e.intl.faltam} ponto${e.intl.faltam === 1 ? '' : 's'} pra entrar na zona da Libertadores.`, en: `Top 8 at stake: ${e.intl.faltam} point${e.intl.faltam === 1 ? '' : 's'} short of the Libertadores zone.`, tag: ['seu clube', 'your club'] }, 3)
    } else if (sequencia(f, 'V') >= 2) {
      const n = sequencia(f, 'V')
      noticias.push({ emoji: '🏠', pt: `Você vem de ${n} vitórias seguidas — o vestiário está leve.`, en: `You come off ${n} straight wins — the dressing room is buzzing.`, tag: ['seu clube', 'your club'] }, 3)
    } else if (semPerder(f) >= 3) {
      noticias.push({ emoji: '🏠', pt: `${semPerder(f)} jogos sem perder: a sua defesa virou assunto.`, en: `${semPerder(f)} games unbeaten: your defense is the talk of the town.`, tag: ['seu clube', 'your club'] }, 3)
    } else if (semVencer(f) >= 3 && !crise?.x.you) {
      noticias.push({ emoji: '🏠', pt: `Você não vence há ${semVencer(f)} jogos — a próxima rodada pede três pontos.`, en: `You haven't won in ${semVencer(f)} games — next round calls for three points.`, tag: ['seu clube', 'your club'] }, 3)
    } else if (e.compras.length) {
      const total = e.compras.reduce((n, c) => n + c.paid, 0), top = [...e.compras].sort((a, b) => b.paid - a.paid)[0]
      noticias.push({ emoji: '🏠', pt: `Você investiu 🪙 ${total} em ${e.compras.length} contrataç${e.compras.length > 1 ? 'ões' : 'ão'} nesta temporada; a maior foi ${top.name} (🪙 ${top.paid}).`, en: `You invested 🪙 ${total} in ${e.compras.length} signing${e.compras.length > 1 ? 's' : ''} this season; the biggest was ${top.name} (🪙 ${top.paid}).`, tag: ['seu clube', 'your club'] }, 3)
    }
  }
  // ── 🩹 lesão/suspensão no SEU elenco ──────────────────────────────────────
  if (e.lesao) {
    const l = e.lesao
    noticias.push({ emoji: '🩹', pt: `${l.nome} está fora (${l.motivo[0]}): volta em ${l.jogosFora} jogo${l.jogosFora === 1 ? '' : 's'}.`, en: `${l.nome} is out (${l.motivo[1]}): back in ${l.jogosFora} game${l.jogosFora === 1 ? '' : 's'}.`, tag: ['seu clube', 'your club'] }, 1)
  }
  // ── 🌱 cria da base de titular ────────────────────────────────────────────
  if (e.criaTitular) noticias.push({ emoji: '🌱', pt: `Cria da base ${e.criaTitular} vai de titular no próximo jogo — a torcida quer ver.`, en: `Academy kid ${e.criaTitular} starts the next match — the fans want a look.`, tag: ['seu clube', 'your club'] }, 1)
  // ── 🏆 copa chegando ──────────────────────────────────────────────────────
  for (const c of e.copaChegando ?? []) {
    if (c.rodadasFaltam != null) noticias.push({ emoji: '🏆', pt: `${c.nome[0]} chegando: ${c.rodadasFaltam === 0 ? 'o mata-mata começa logo depois desta rodada' : `faltam ${c.rodadasFaltam} rodada${c.rodadasFaltam === 1 ? '' : 's'} pro mata-mata`}.`, en: `${c.nome[1]} is coming: ${c.rodadasFaltam === 0 ? 'the knockout starts right after this round' : `${c.rodadasFaltam} round${c.rodadasFaltam === 1 ? '' : 's'} until the knockout`}.`, tag: ['copa', 'cup'] }, 2)
    else if (c.esteAno) noticias.push({ emoji: '🌍', pt: `${c.nome[0]} é nesta temporada — rola depois da liga.`, en: `${c.nome[1]} is this season — it runs after the league.`, tag: ['copa', 'cup'] }, 2)
    else if (c.proximaTemporada) noticias.push({ emoji: '🗓️', pt: `${c.nome[0]} começa na próxima temporada. Prepara o elenco.`, en: `${c.nome[1]} starts next season. Get the squad ready.`, tag: ['copa', 'cup'] }, 2)
  }
  // ── 🗞️ outra divisão, pra variar ──────────────────────────────────────────
  if (e.outraDiv) {
    const o = e.outraDiv
    noticias.push({ emoji: '🗞️', pt: `${o.divName}: ${o.lider} lidera com ${o.pts} pontos.`, en: `${o.divNameEn}: ${o.lider} lead on ${o.pts} points.`, tag: [o.divName.toLowerCase(), o.divNameEn.toLowerCase()] })
  }
  return { manchete, noticias: fila.map((x, i) => ({ ...x, i })).sort((a, b) => a.pri - b.pri || a.i - b.i).slice(0, 7).map(x => x.n) }
}
