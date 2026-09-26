// ─── ⚽🥅 AS CHANCES DO JOGO — o golzinho com lances (módulo puro) ─────────────
//
// Pedido do Diego (26/09), aprovando o mockup: *"vários estilos: a bola por cima
// do gol, na trave, pra fora, isolou… a narração acompanha o momento certo. E a
// bola tem que entrar no gol se der. Seria um suspense. O placar só mostra o gol
// quando a bola entrar. Não mudaria a dinâmica dos gols, mas teria coisas
// acontecendo enquanto não sai gol."* E depois: *"adorei, só aperfeiçoar a bola
// entrar mesmo no gol e balançar com ela dentro… o isolou sai rasteira, sobe e
// passa por cima do gol"*.
//
// O que este módulo decide:
//   · QUANDO acontece uma chance perdida (minuto), de QUEM (lado) e COMO termina
//     (🧤 defendeu · 🥅 na trave · 💨 pra fora · 🚀 isolou);
//   · o TEXTO da narração dela, em PT e EN.
// O que ele NÃO decide: os gols. Os gols são os da simulação — mesmo minuto,
// mesmo autor, mesmo placar. As chances são TEATRO em volta deles.
//
// Regras da casa:
//   · 🎲 DETERMINÍSTICO: sorteio preso na semente da rodada + nomes dos clubes →
//     no online a sala inteira vê a mesma chance no mesmo minuto.
//   · 🙈 ANTI-SPOILER: chance perdida nunca cai perto do minuto de um gol de
//     verdade (fica a ≥ 3' de distância) — assim nem por eliminação dá pra
//     adivinhar quando vem o gol. E ela não diz nada sobre o futuro.
//   · ⏱️ CABE NO TEMPO REAL: a chance leva ~1,2 s na tela. No online a rodada
//     inteira dura 11 s (93' em ~9 s), então lá cabe UMA por lado, bem espaçada;
//     na carreira (rodada mais lenta) cabem mais. Quem manda é `roundMs`.
//   · 🚫 SEM PÊNALTI (ordem de 19/09): pênalti tem tela própria.
//   · 🧍 Fala do CLUBE, não de jogador: o placar não tem escalação, e inventar
//     quem chutou seria inventar como uma pessoa é (regra de 18/08).
//   · 🌐 PT e EN com a MESMA quantidade de frases (o sorteio é por índice).

export type FimDaChance = 'defendeu' | 'trave' | 'fora' | 'isolou'
export type Chance = { min: number; home: boolean; fim: FimDaChance }

// ⏱️ quanto a chance fica na tela (voo 0,6 s + final ~0,55 s + um respiro)
export const CHANCE_MS = 1900

const FINS: FimDaChance[] = ['defendeu', 'trave', 'fora', 'isolou']

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(txt: string, n: number) { let h = 2166136261 ^ n; for (let i = 0; i < txt.length; i++) h = Math.imul(h ^ txt.charCodeAt(i), 16777619); return h >>> 0 }

/**
 * quantas chances cabem POR LADO numa rodada de `roundMs`:
 * o relógio anda 93' em `max(400, roundMs·0,82)` ms, e cada chance ocupa CHANCE_MS.
 * ⚠️ O ONLINE É RÁPIDO DE VERDADE: a rodada da sala/Minhas Ligas dura 7 s (o jogo
 * anima em ~5,7 s). Pra caber UMA chance por lado ali, a conta é "quantas
 * CHANCE_MS cabem no jogo, metade pra cada lado" — o espaçamento mínimo (`gap`)
 * é quem garante que duas nunca ficam na tela juntas, e sobra menos que isso
 * quando os gols ocupam o calendário. Carreira (11 s) = 2 por lado; rodada lenta
 * (30 s+) = até 4; rodada instantânea = nenhuma.
 */
export function chancesPorLado(roundMs: number): number {
  const dur = Math.max(400, roundMs * 0.82)
  const cabem = Math.floor(dur / CHANCE_MS)
  return Math.max(0, Math.min(4, Math.floor(cabem / 2)))
}

/** ⚽ as chances perdidas de UM jogo — nunca no minuto (±3) de um gol de verdade */
export function chancesDoJogo(seed: number, gols: { min: number; home: boolean }[], roundMs: number): Chance[] {
  const porLado = chancesPorLado(roundMs)
  if (porLado === 0) return []
  const rng = mulberry(seed >>> 0)
  const dur = Math.max(400, roundMs * 0.82)
  const msPorMin = dur / 93
  // distância mínima entre dois eventos na tela (chance ou gol), em minutos de jogo
  const gap = Math.ceil(CHANCE_MS / msPorMin) + 3
  const ocupados: number[] = gols.map(g => g.min)
  const livre = (m: number) => ocupados.every(o => Math.abs(o - m) >= Math.max(3, gap)) && !(m >= 43 && m <= 47)
  const out: Chance[] = []
  for (const home of [true, false]) {
    let feitas = 0, tentativas = 0
    while (feitas < porLado && tentativas < 40) {
      tentativas++
      const m = 4 + Math.floor(rng() * 85) // 4'…88'
      if (!livre(m)) continue
      ocupados.push(m)
      out.push({ min: m, home, fim: FINS[Math.floor(rng() * FINS.length)] })
      feitas++
    }
  }
  return out.sort((a, b) => a.min - b.min)
}

/** a semente de um jogo: rodada + os dois clubes (a mesma em todo aparelho da sala) */
export const sementeDasChances = (roundKey: number, home: string, away: string) => hash(`${home}|${away}`, Math.abs(roundKey) * 7919)

type Par = [pt: string, en: string]
// {t} = o clube que atacou
const BANCO: Record<FimDaChance, Par[]> = {
  defendeu: [
    ['{t} chega com perigo… DEFENDEU o goleiro! Que mão!', '{t} with a dangerous attack… SAVED by the keeper! What a hand!'],
    ['chute forte do {t}… e o goleiro ESPALMOU! Escanteio.', 'a powerful strike from {t}… and the keeper PARRIED it! Corner.'],
    ['{t} cabeceia na pequena área… o goleiro PEGOU! Milagre.', '{t} heads it in the six-yard box… the keeper HOLDS it! A miracle.'],
    ['{t} sozinho na cara do gol… e DEFENDEU com o pé! Inacreditável.', '{t} one-on-one with the keeper… SAVED with the foot! Unbelievable.'],
    ['bomba do {t} de fora da área… o goleiro VOOU no ângulo!', 'a rocket from {t} from outside the box… the keeper FLEW to the top corner!'],
    ['{t} finaliza cruzado… o goleiro caiu no canto certo. Defendeu.', '{t} shoots across goal… the keeper went the right way. Saved.'],
  ],
  trave: [
    ['{t} bate cruzado… NA TRAVE! O estádio gelou.', '{t} hits it across goal… OFF THE POST! The stadium froze.'],
    ['{t} de cabeça… no TRAVESSÃO! Por centímetros.', '{t} with a header… off the CROSSBAR! By centimetres.'],
    ['{t} arrisca de longe… bateu na TRAVE e voltou! Que azar.', '{t} tries from distance… hit the POST and came back! Unlucky.'],
    ['{t} tira o goleiro da jogada… e a bola explode na TRAVE!', '{t} takes the keeper out of it… and the ball smashes the POST!'],
    ['cobrança de falta do {t}… tocou no travessão e saiu. Quase!', 'a free kick from {t}… clipped the bar and went out. So close!'],
    ['{t} finaliza de primeira… TRAVE! O goleiro nem se mexeu.', '{t} shoots first time… POST! The keeper never moved.'],
  ],
  fora: [
    ['{t} arrisca de longe… PRA FORA! Passou raspando.', '{t} tries from range… WIDE! Just past the post.'],
    ['{t} chega batendo… pra fora, tirando tinta da trave!', '{t} arrives shooting… wide, shaving the paint off the post!'],
    ['cruzamento do {t} e a finalização saiu à esquerda do gol.', 'a cross from {t} and the finish went left of the goal.'],
    ['{t} tenta o chute colocado… passou perto, mas foi pra fora.', '{t} goes for the placed shot… close, but wide.'],
    ['{t} bate de fora da área e a bola passa rente ao poste.', '{t} shoots from outside the box and the ball skims past the post.'],
    ['{t} livre na área… e chutou pra fora! Perdeu gol feito.', '{t} free in the box… and shot wide! A sitter missed.'],
  ],
  isolou: [
    ['{t} sozinho na área… ISOLOU! Foi pra arquibancada.', '{t} alone in the box… SKIED IT! Into the stands.'],
    ['{t} pega de primeira… e manda por cima do gol. Isolou!', '{t} hits it first time… and blasts it over the bar. Skied!'],
    ['{t} tenta de longe… a bola sobe, sobe… e vai pra fora do estádio!', '{t} tries from range… the ball rises, rises… and leaves the stadium!'],
    ['{t} na marca do pênalti… CHUTOU PRA LUA! Que isso!', '{t} at the penalty spot… KICKED IT TO THE MOON! What was that!'],
    ['{t} de cabeça, sem marcação… por cima do travessão. Isolou.', '{t} with a free header… over the bar. Skied.'],
    ['{t} recebe na entrada da área… bateu torto e a bola foi embora!', '{t} picks it up at the edge of the box… mishit, and the ball is gone!'],
  ],
}
// ⚠️ "na marca do pênalti" é LUGAR do campo, não cobrança de pênalti — o lance é
// de jogada. Nenhuma frase aqui narra cobrança de pênalti (ordem de 19/09).

/** o texto da chance, no idioma pedido — determinístico pelo minuto + clube */
export function narraChance(c: Chance, clube: string, en: boolean): string {
  const lista = BANCO[c.fim]
  const par = lista[hash(clube, c.min * 31 + c.fim.length) % lista.length]
  return (en ? par[1] : par[0]).replace(/\{t\}/g, clube)
}

/** o veredito que pula na faixa — o MESMO vocabulário do palco dos pênaltis */
export function vereditoDaChance(fim: FimDaChance | 'gol', en: boolean): string {
  return ({
    defendeu: en ? '🧤 SAVED!' : '🧤 DEFENDEU!',
    trave: en ? '🥅 OFF THE POST!' : '🥅 NA TRAVE!',
    fora: en ? '💨 WIDE!' : '💨 PRA FORA!',
    isolou: en ? '🚀 SKIED IT!' : '🚀 ISOLOU!',
    gol: en ? '⚽ GOOOAL!' : '⚽ GOOOL!',
  })[fim]
}

/** tamanho de cada banco (pra trava): os dois idiomas têm que ter o mesmo número */
export const ACERVO_CHANCES = Object.fromEntries(FINS.map(f => [f, BANCO[f].length])) as Record<FimDaChance, number>
