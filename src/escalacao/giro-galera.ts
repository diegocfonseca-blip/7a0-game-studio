// ─── 🎤 GIRO DA GALERA — manchetes sobre AS PESSOAS da sala (módulo puro) ────
//
// Pedido do Diego (26/09), ao aprovar o letreiro: *"nos modos rápido online e
// minhas ligas você poderia pôr mais textos em relação aos usuários que estão
// jogando"*. O giro de hoje é neutro de propósito (líder, zebra, goleada…) e
// quase nunca cita QUEM está jogando — e a alma do jogo é a zoeira entre amigos.
//
// Regras que este módulo respeita:
//   · 📏 NADA INVENTADO: toda frase sai do que aconteceu na rodada (placar, quem
//     é humano, posição na tabela, retrospecto humano×humano). Sem número mágico.
//   · 🎲 VARIEDADE PRESA NA SEMENTE: a frase escolhida é a mesma no host e em
//     todo convidado (online é host-autoritativo; o giro viaja no estado, mas a
//     escolha não pode depender de Math.random de cada aparelho).
//   · 🌐 PT guardado, EN por tradução (`traduzGalera`) — igual ao resto do giro,
//     porque a manchete mora no save e o idioma pode trocar depois.
//   · 🙈 O anti-spoiler é de quem MOSTRA (o giro é segurado até o apito); aqui só
//     se escreve. Os emojis de abertura são fixos justamente pra tela reconhecer.
//   · 🚫 Nunca cita jogador de mentira nem inventa como uma pessoa é: fala de
//     CLUBE e de PLACAR, que é o que a sala inteira viu.
//
// Onde é chamado: rodada da liga (`narrateRound`), rodada da tabela da Champions,
// rodada de grupo da Liberta e cada perna do mata-mata (`quickCopa`).

export type JogoGalera = { homeId: number; awayId: number; hg: number; ag: number }
export type OpcoesGalera = {
  jogos: JogoGalera[]
  nomeDe: (id: number) => string
  ehHumano: (id: number) => boolean
  /** posição na tabela AGORA (1 = líder). Ausente = competição sem tabela (mata-mata). */
  posDe?: (id: number) => number | undefined
  /** posição ANTES da rodada — serve pra saber se o "melhor da sala" mudou */
  posAntes?: (id: number) => number | undefined
  /** retrospecto humano×humano, do ponto de vista de `a` */
  h2h?: (a: number, b: number) => { w: number; l: number; d: number }
  seed: number
  /** quantas manchetes no máximo (o giro mostra poucas — 2 é o padrão) */
  max?: number
}

// gerador semeado (o mesmo mulberry do resto do jogo — copiado, não importado,
// pra este módulo continuar puro e testável sozinho)
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const pick = <T,>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length) % arr.length]

/** 🎤 as manchetes da rodada sobre as pessoas — do que mais rende zoeira pro que menos */
export function narraGalera(o: OpcoesGalera): string[] {
  const rng = mulberry(o.seed >>> 0)
  const out: string[] = []
  const max = o.max ?? 2
  const humanos = new Set<number>()
  for (const j of o.jogos) { if (o.ehHumano(j.homeId)) humanos.add(j.homeId); if (o.ehHumano(j.awayId)) humanos.add(j.awayId) }
  if (humanos.size === 0) return out

  // 1️⃣ 🥊 CLÁSSICO DA SALA — humano contra humano é o que a sala inteira quer ler
  for (const j of o.jogos) {
    if (out.length >= max) break
    if (!o.ehHumano(j.homeId) || !o.ehHumano(j.awayId)) continue
    const A = o.nomeDe(j.homeId), B = o.nomeDe(j.awayId)
    if (j.hg === j.ag) {
      if (j.hg === 0) out.push(pick(rng, [
        `😴 ${A} 0 × 0 ${B}: 90 minutos de nada. Cobram ingresso por isso?`,
        `😴 ${A} 0 × 0 ${B}: os dois vieram só pra marcar presença.`,
      ]))
      else out.push(pick(rng, [
        `🤝 ${A} ${j.hg} × ${j.ag} ${B}: empate na sala — ninguém tem moral pra falar nada.`,
        `🤝 ${A} ${j.hg} × ${j.ag} ${B}: dividiram os pontos e a vergonha.`,
      ]))
      continue
    }
    const wId = j.hg > j.ag ? j.homeId : j.awayId, lId = j.hg > j.ag ? j.awayId : j.homeId
    const W = o.nomeDe(wId), L = o.nomeDe(lId)
    const wg = Math.max(j.hg, j.ag), lg = Math.min(j.hg, j.ag)
    const fecho = pick(rng, [
      `${W} leva a rodada no papo.`,
      `${L} vai ficar de castigo no grupo.`,
      `${W} tem moral pra semana inteira.`,
      `e ${L} ainda vai dizer que o juiz roubou.`,
      `${L} já pediu revanche no privado.`,
    ])
    // 📒 o retrospecto entre os dois, quando existe — é o que mais dói na mesa
    let h2h = ''
    const r = o.h2h?.(wId, lId)
    if (r && r.w + r.l + r.d > 1) h2h = r.w === r.l ? ` No confronto: empatado em ${r.w} a ${r.l}.` : ` No confronto: ${Math.max(r.w, r.l)} a ${Math.min(r.w, r.l)} pro ${r.w > r.l ? W : L}.`
    out.push(`🥊 CLÁSSICO DA SALA: ${W} ${wg} × ${lg} ${L} — ${fecho}${h2h}`)
  }

  // 2️⃣ 🤡 HUMANO TOMOU DE BOT (3+ de diferença) — a máquina venceu gente
  for (const j of o.jogos) {
    if (out.length >= max) break
    const hh = o.ehHumano(j.homeId), ha = o.ehHumano(j.awayId)
    if (hh === ha) continue // os dois humanos (já foi) ou os dois bots (ninguém liga)
    const humId = hh ? j.homeId : j.awayId, botId = hh ? j.awayId : j.homeId
    const gh = hh ? j.hg : j.ag, gb = hh ? j.ag : j.hg
    if (gb - gh >= 3) out.push(pick(rng, [
      `🤡 ${o.nomeDe(humId)} tomou ${gb} de um BOT (${o.nomeDe(botId)}). A sala inteira viu.`,
      `🤡 ${o.nomeDe(botId)} é robô e passeou: ${gb} × ${gh} no ${o.nomeDe(humId)}.`,
    ]))
  }

  // 3️⃣ 🎩 O MELHOR TÉCNICO DA SALA MUDOU (só com tabela e com posição de antes)
  if (out.length < max && o.posDe && o.posAntes && humanos.size >= 2) {
    const ordena = (pos: (id: number) => number | undefined) => [...humanos].map(id => ({ id, p: pos(id) ?? 999 })).sort((a, b) => a.p - b.p)[0]
    const agora = ordena(o.posDe), antes = ordena(o.posAntes)
    if (agora && antes && agora.id !== antes.id && agora.p < 999) out.push(pick(rng, [
      `🎩 ${o.nomeDe(agora.id)} é o melhor técnico da sala agora: ${agora.p}º na tabela. ${o.nomeDe(antes.id)} perdeu o posto.`,
      `🎩 Troca de dono na sala: ${o.nomeDe(agora.id)} passou ${o.nomeDe(antes.id)} e é o melhor da turma, em ${agora.p}º.`,
    ]))
  }

  // 4️⃣ 🐌 O PIOR DA SALA PERDEU DE NOVO (3+ humanos, com tabela)
  if (out.length < max && o.posDe && humanos.size >= 3) {
    const pior = [...humanos].map(id => ({ id, p: o.posDe!(id) ?? 0 })).sort((a, b) => b.p - a.p)[0]
    const perdeu = pior && o.jogos.some(j => (j.homeId === pior.id && j.hg < j.ag) || (j.awayId === pior.id && j.ag < j.hg))
    if (pior && perdeu && pior.p > 0) out.push(pick(rng, [
      `🐌 ${o.nomeDe(pior.id)} é o pior técnico da sala: ${pior.p}º e perdeu de novo. Bora, guerreiro.`,
      `🐌 ${o.nomeDe(pior.id)} segue no fundo da sala, em ${pior.p}º. Alguém manda um abraço.`,
    ]))
  }

  // 5️⃣ 🧨 HUMANO PASSOU O TRATOR num bot (4+ de diferença)
  for (const j of o.jogos) {
    if (out.length >= max) break
    const hh = o.ehHumano(j.homeId), ha = o.ehHumano(j.awayId)
    if (hh === ha) continue
    const humId = hh ? j.homeId : j.awayId, botId = hh ? j.awayId : j.homeId
    const gh = hh ? j.hg : j.ag, gb = hh ? j.ag : j.hg
    if (gh - gb >= 4) out.push(`🧨 ${o.nomeDe(humId)} passou o trator: ${gh} × ${gb} no ${o.nomeDe(botId)}.`)
  }

  // 6️⃣ 🤖 HUMANO PERDEU PRA BOT (qualquer placar) — só se sobrou espaço
  for (const j of o.jogos) {
    if (out.length >= max) break
    const hh = o.ehHumano(j.homeId), ha = o.ehHumano(j.awayId)
    if (hh === ha) continue
    const humId = hh ? j.homeId : j.awayId, botId = hh ? j.awayId : j.homeId
    const gh = hh ? j.hg : j.ag, gb = hh ? j.ag : j.hg
    if (gb > gh && gb - gh < 3) out.push(`🤖 A máquina não tem dó: ${o.nomeDe(botId)} ${gb} × ${gh} ${o.nomeDe(humId)}.`)
  }

  return out.slice(0, max)
}

/** 🚫 os emojis que abrem TODA manchete da galera — a tela usa pra segurar até o apito */
export const GALERA_ABERTURAS = ['🥊', '🤝', '😴', '🤡', '🎩', '🐌', '🧨', '🤖'] as const
export const ehMancheteGalera = (h: string) => GALERA_ABERTURAS.some(e => h.startsWith(e))

/** 🌐 PT → EN, frase a frase (devolve null se não for manchete da galera) */
export function traduzGalera(t: string): string | null {
  let r: RegExpMatchArray | null
  const ord = (n: string) => { const k = +n, s = k % 100 >= 11 && k % 100 <= 13 ? 'th' : k % 10 === 1 ? 'st' : k % 10 === 2 ? 'nd' : k % 10 === 3 ? 'rd' : 'th'; return `${k}${s}` }
  if ((r = t.match(/^😴 (.+) 0 × 0 (.+): 90 minutos de nada\. Cobram ingresso por isso\?$/))) return `😴 ${r[1]} 0 × 0 ${r[2]}: ninety minutes of nothing. Do they charge for this?`
  if ((r = t.match(/^😴 (.+) 0 × 0 (.+): os dois vieram só pra marcar presença\.$/))) return `😴 ${r[1]} 0 × 0 ${r[2]}: both just showed up to sign the attendance sheet.`
  if ((r = t.match(/^🤝 (.+) (\d+) × (\d+) (.+): empate na sala — ninguém tem moral pra falar nada\.$/))) return `🤝 ${r[1]} ${r[2]} × ${r[3]} ${r[4]}: a draw in the room — nobody gets to talk trash.`
  if ((r = t.match(/^🤝 (.+) (\d+) × (\d+) (.+): dividiram os pontos e a vergonha\.$/))) return `🤝 ${r[1]} ${r[2]} × ${r[3]} ${r[4]}: they split the points and the shame.`
  if ((r = t.match(/^🥊 CLÁSSICO DA SALA: (.+) (\d+) × (\d+) (.+) — (.+?)( No confronto: .+)?$/))) {
    const W = r[1], L = r[4]
    const fecho = r[5]
      .replace(`${W} leva a rodada no papo.`, `${W} owns the round.`)
      .replace(`${L} vai ficar de castigo no grupo.`, `${L} is grounded in the group chat.`)
      .replace(`${W} tem moral pra semana inteira.`, `${W} has bragging rights all week.`)
      .replace(`e ${L} ainda vai dizer que o juiz roubou.`, `and ${L} will still blame the ref.`)
      .replace(`${L} já pediu revanche no privado.`, `${L} already asked for a rematch in the DMs.`)
    let h2h = r[6] ?? ''
    let m: RegExpMatchArray | null
    if ((m = h2h.match(/^ No confronto: empatado em (\d+) a (\d+)\.$/))) h2h = ` Head to head: level at ${m[1]}–${m[2]}.`
    else if ((m = h2h.match(/^ No confronto: (\d+) a (\d+) pro (.+)\.$/))) h2h = ` Head to head: ${m[1]}–${m[2]} to ${m[3]}.`
    return `🥊 ROOM DERBY: ${W} ${r[2]} × ${r[3]} ${L} — ${fecho}${h2h}`
  }
  if ((r = t.match(/^🤡 (.+) tomou (\d+) de um BOT \((.+)\)\. A sala inteira viu\.$/))) return `🤡 ${r[1]} shipped ${r[2]} to a BOT (${r[3]}). The whole room saw it.`
  if ((r = t.match(/^🤡 (.+) é robô e passeou: (\d+) × (\d+) no (.+)\.$/))) return `🤡 ${r[1]} is a robot and strolled through it: ${r[2]} × ${r[3]} over ${r[4]}.`
  if ((r = t.match(/^🎩 (.+) é o melhor técnico da sala agora: (\d+)º na tabela\. (.+) perdeu o posto\.$/))) return `🎩 ${r[1]} is the room's best manager now: ${ord(r[2])} in the table. ${r[3]} lost the crown.`
  if ((r = t.match(/^🎩 Troca de dono na sala: (.+) passou (.+) e é o melhor da turma, em (\d+)º\.$/))) return `🎩 New boss in the room: ${r[1]} passed ${r[2]} and is the best of the bunch, in ${ord(r[3])}.`
  if ((r = t.match(/^🐌 (.+) é o pior técnico da sala: (\d+)º e perdeu de novo\. Bora, guerreiro\.$/))) return `🐌 ${r[1]} is the room's worst manager: ${ord(r[2])} and lost again. Chin up, warrior.`
  if ((r = t.match(/^🐌 (.+) segue no fundo da sala, em (\d+)º\. Alguém manda um abraço\.$/))) return `🐌 ${r[1]} is still at the bottom of the room, in ${ord(r[2])}. Somebody send a hug.`
  if ((r = t.match(/^🧨 (.+) passou o trator: (\d+) × (\d+) no (.+)\.$/))) return `🧨 ${r[1]} ran the bulldozer: ${r[2]} × ${r[3]} over ${r[4]}.`
  if ((r = t.match(/^🤖 A máquina não tem dó: (.+) (\d+) × (\d+) (.+)\.$/))) return `🤖 The machine shows no mercy: ${r[1]} ${r[2]} × ${r[3]} ${r[4]}.`
  return null
}
