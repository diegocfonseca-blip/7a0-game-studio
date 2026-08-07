// ─── 🎭 EVENTOS DE JOGADOR (carreira SOLO) — módulo PURO, sem React ────────
// Histórias cômicas com decisão: o baladeiro que sumiu na noitada, o pavio-curto
// expulso, a lesão boba. Regras combinadas com o Diego:
//  · no MÁXIMO 1 evento por temporada, sempre ANTES do fim (rodadas 3..31);
//  · só dispara se EXISTE reserva na posição (senão vira SÓ manchete, nada trava);
//  · lesão MORRE pra sempre quando o clube constrói o 🏥 Departamento Médico;
//  · a troca usa a MESMA vaga (posição igual) — a formação NUNCA quebra;
//  · a suspensão morre na virada da temporada (o titular volta sozinho);
//  · zoeira leve e fictícia SEMPRE — nunca tragédia/lesão real de ninguém.
import type { Sector, EventoTipo } from './types'

// carta "mínima" que o sorteio precisa (WonCard e PoolCard da tela servem)
export interface EventoCard { id: string; name: string; pos: Sector }

// mesmo gerador determinístico do resto do jogo (cópia local — módulo puro)
function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// ─── 🍾 / 🌡️ traits (curados à mão, POR NOME EXATO da carta) ───────────────
// Só folclore LEVE e celebrado (balada famosa, pavio famoso) + folclóricos
// inventados do jogo. NUNCA entra aqui quem teve tragédia real com o tema.
// 🎲 05/08: listas ampliadas (relato de vários jogadores — "sempre o Romário" em
// todo mundo). Mais nomes = o sorteio se espalha, ninguém carrega o time sozinho.
const BALADEIROS = new Set([
  // 🇧🇷 lendas da resenha (folclore leve e público)
  'Romário', 'Adriano', 'Adriano Imperador', 'Ronaldinho Gaúcho', 'Vampeta',
  'Renato Gaúcho', 'Loco Abreu', 'Neymar', 'Zé Love', 'Casagrande', 'Sócrates',
  // 🌍 Europa/mundo
  'Mario Balotelli', 'Radja Nainggolan',
  // 🎪 folclóricos inventados/do baralho (zoeira 100% livre)
  'Baixinho da Kombi', 'Careca do Posto', 'Gugu Canela', 'Dão da Feira',
  'Douglas Barriga de Cadela', 'Dedé Bigode', 'Gilmar Fubá', 'Juca Trovão', 'Bilu Tetéia',
  'André Balada', 'Beto Cachaça',
])
const PAVIO_CURTO = new Set([
  // 🇧🇷 pavio famoso (episódios já folclóricos)
  'Edmundo', 'Felipe Melo', 'Djalminha', 'Tevez',
  // 🌍 Europa/mundo (cabeçada do Zidane, kung-fu do Cantona… memes mundiais)
  'Zinedine Zidane', 'Éric Cantona', 'Roy Keane', 'Marco Materazzi',
  'Zlatan Ibrahimović', 'Suárez', 'Luis Suárez', 'Diego Costa', 'Sergio Ramos', 'Pepe',
  // 🎪 folclóricos inventados
  'Cabeção', 'Cabeção da Vila', 'Bode', 'Girino', 'Barão',
])
export function traitDe(nome: string): '🍾 baladeiro' | '🌡️ pavio curto' | null {
  if (BALADEIROS.has(nome)) return '🍾 baladeiro'
  if (PAVIO_CURTO.has(nome)) return '🌡️ pavio curto'
  return null
}

// ─── 📜 as histórias (tudo FICÇÃO cômica — {n} = nome do jogador) ──────────
const HIST_NOITADA = [
  'O {n} sumiu depois do jantar e apareceu no treino de ÓCULOS ESCUROS, bocejando. O preparador jura que ele "dormiu cedo". 😎',
  'Marcaram o {n} numa foto às 4h da manhã — no aniversário de um "primo". A assessoria diz que era "suco de uva". 🍾',
  'O {n} confundiu o horário: achou que o treino era à tarde. O churrasco de ontem, segundo ele, "era só um almoço que rendeu". 🍖',
  'O segurança do clube viu o {n} chegando de carona no carro do som. Ele garante que estava "fazendo trabalho social na balada". 🪩',
  'O {n} postou "só água hoje" às 23h — e às 5h da manhã tava cantando funk ao vivo pro Instagram. Deletou depois, mas a internet não esquece. 📱',
  'O motorista de aplicativo do {n} avaliou a corrida com 1 estrela: "cliente cantou o hino do time inteiro, de trás pra frente". 🚗',
  'O {n} apareceu no CT ainda de roupa de festa, dizendo que "só passou pra pegar um esquecido". Ninguém acreditou, nem o próprio esquecido. 🕺',
  'Flagraram o {n} pedindo pizza às 3h pro hotel de concentração. A pizza chegou. Ele, no horário do café da manhã, não. 🍕',
  'O {n} jura que foi só "hidratar no bar" — mas a comanda tinha mais garrafa que copo d\'água. A auditoria do clube não fechou a conta. 🧾',
  'A vizinhança denunciou paredão de som na casa do {n} até as 6h. Ele alegou "insônia com trilha sonora". O síndico não perdoou. 🔊',
]
const HIST_EXPULSAO = [
  'O {n} discutiu com o juiz, com o bandeira e — testemunhas garantem — com o gandula. Vermelho direto e relatório de 3 páginas. 🟥',
  'O {n} deu uma voadora na PLACA DE PUBLICIDADE depois do gol anulado. A placa não revidou, mas o juiz viu. 🟥',
  'O {n} pediu pro juiz "ir estudar as regras". O juiz mostrou que conhece pelo menos uma: a do cartão vermelho. 🟥',
  'O {n} chutou a bola pra arquibancada em protesto — e ela voltou, porque um torcedor devolveu na hora. Vermelho e vaia dupla. 🟥',
  'O {n} imitou o juiz apitando de mentirinha depois do pênalti não marcado. O juiz achou pouca graça e mostrou o cartão de verdade. 🟥',
  'O {n} arrancou a braçadeira de capitão e jogou no chão em plena discussão. O juiz interpretou como "gesto de desrespeito" — e não errou. 🟥',
  'O {n} correu 40 metros só pra discutir um escanteio que nem era dele. Chegou ofegante, saiu de vermelho. 🟥',
  'O {n} deu risada na cara do quarto árbitro depois do cartão amarelo. A risada rendeu o segundo — e o banho mais cedo. 🟥',
]
const HIST_LESAO = [
  'O {n} sentiu o músculo NO AQUECIMENTO — antes de tocar na bola. O departamento (que não existe) lamenta. 🩹',
  'O {n} torceu o tornozelo ensaiando a dança da comemoração no treino. A coreografia era linda, dizem. 🩹',
  'O {n} escorregou na escada do vestiário carregando a caixa de bolas. As bolas estão bem. Ele, mais ou menos. 🩹',
  'O {n} travou as costas amarrando a chuteira. A idade chega pra todos — até pras lendas. 🩹',
  'O {n} espirrou forte demais no vestiário e sentiu uma pontada nas costas. O fisioterapeuta nunca viu nada igual. 🤧',
  'O {n} pisou na bola largada por engano no corredor do CT — literalmente. O tombo virou vídeo viral no grupo do elenco. 🩹',
  'O {n} forçou o braço tirando selfie com um torcedor antes do jogo. O ombro não aguentou o ângulo. 📸',
  'O {n} sentiu uma fisgada comemorando um gol de PELADA no dia de folga. Ele jura que "não valia nada". Valeu 3 semanas de departamento médico. 🩹',
  'O {n} deu um mau jeito descendo do ônibus com a mochila pesada demais de chuteira. A mochila venceu. 🎒',
]

export interface EventoSorteado {
  tipo: EventoTipo
  card: EventoCard
  rodadas: number
  historia: string
  reservas: EventoCard[] // reservas da MESMA posição (troca sem quebrar formação); vazio = só manchete
}

// janela do evento na temporada (0-based; o jogo da rodada AINDA vai rolar):
// nunca nas primeiras 2 nem depois da 31ª — "antes de chegar no final" (Diego).
export const EVENTO_MIN_ROUND = 2
export const EVENTO_MAX_ROUND = 30

// ─── 🎲 o sorteio da temporada (determinístico pela semente) ───────────────
// Uma rodada-alvo por temporada + ~15% das temporadas passam em branco. Ao
// chegar na rodada-alvo (ou depois, se o jogo pulou), sorteia o jogador do XI:
// baladeiro→noitada, pavio→expulsão (peso 4× cada) e qualquer um→lesão (peso 1,
// e SÓ se o clube ainda não tem o 🏥 Departamento Médico).
export function sorteiaEvento(args: {
  seed: number; seasonNo: number; round: number
  xi: EventoCard[]; squad: EventoCard[]; temMedico: boolean
  avoidName?: string // 🔁 nome do "causo" da temporada PASSADA — evita repetir o mesmo craque toda vez (relato: "sempre o Romário")
}): EventoSorteado | null {
  const { seed, seasonNo, round, xi, squad, temMedico, avoidName } = args
  if (round < EVENTO_MIN_ROUND || round > EVENTO_MAX_ROUND) return null
  const rng = mulberry((seed ^ Math.imul(seasonNo, 2654435761) ^ 0x77AA11) >>> 0)
  if (rng() < 0.15) return null // temporada em branco (nem toda temporada tem causo)
  const alvo = EVENTO_MIN_ROUND + Math.floor(rng() * (EVENTO_MAX_ROUND - EVENTO_MIN_ROUND + 1))
  if (round < alvo) return null
  // candidatos do XI ATUAL (o evento é sempre com um titular seu)
  const pool: { c: EventoCard; tipo: EventoTipo }[] = []
  for (const c of xi) {
    const t = traitDe(c.name)
    if (t === '🍾 baladeiro') for (let i = 0; i < 4; i++) pool.push({ c, tipo: 'noitada' })
    if (t === '🌡️ pavio curto') for (let i = 0; i < 4; i++) pool.push({ c, tipo: 'expulsao' })
    if (!temMedico) pool.push({ c, tipo: 'lesao' })
  }
  if (!pool.length) return null // 🏥 médico pronto + ninguém folclórico no XI = temporada em paz
  // 🔁 fugiu do MESMO craque duas temporadas seguidas: se sobra opção sem ele, tira
  // do sorteio (só o nome do último causo — não pune quem só tem UM folclórico no XI)
  const semRepeticao = avoidName ? pool.filter(p => p.c.name !== avoidName) : pool
  const poolFinal = semRepeticao.length ? semRepeticao : pool
  const pick = poolFinal[Math.floor(rng() * poolFinal.length)]
  const rodadas = pick.tipo === 'noitada' ? 1 : pick.tipo === 'expulsao' ? 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 5)
  const textos = pick.tipo === 'noitada' ? HIST_NOITADA : pick.tipo === 'expulsao' ? HIST_EXPULSAO : HIST_LESAO
  const historia = textos[Math.floor(rng() * textos.length)].replace('{n}', pick.c.name)
  const xiIds = new Set(xi.map(c => c.id))
  // reserva = MESMA posição, fora do XI (cria e emprestado valem — estão no elenco e jogam)
  const reservas = squad.filter(c => c.pos === pick.c.pos && !xiIds.has(c.id))
  return { tipo: pick.tipo, card: pick.c, rodadas, historia, reservas }
}

// ─── 📰 manchetes pro jornal (página "Aconteceu na temporada") ─────────────
export function eventoEmoji(tipo: EventoTipo): string { return tipo === 'noitada' ? '😎' : tipo === 'expulsao' ? '🟥' : '🩹' }
export function eventoTituloBanner(tipo: EventoTipo, rodadas: number): string {
  if (tipo === 'noitada') return '🚨 PROBLEMA NO VESTIÁRIO'
  if (tipo === 'expulsao') return `🟥 EXPULSO — PEGOU ${rodadas} ${rodadas === 1 ? 'RODADA' : 'RODADAS'}`
  return `🩹 LESIONADO — FORA ${rodadas} ${rodadas === 1 ? 'RODADA' : 'RODADAS'}`
}
export function mancheteDecisao(ev: { tipo: EventoTipo; nome: string; rodadas: number; status: string; subNome?: string; round: number }): { emoji: string; titulo: string; sub: string } {
  const rod = `${ev.rodadas} ${ev.rodadas === 1 ? 'rodada' : 'rodadas'}`
  if (ev.tipo === 'noitada') {
    return ev.status === 'campo'
      ? { emoji: '😎', titulo: `${ev.nome} joga "na base do café" após noitada`, sub: `O técnico bancou a escalação por conta e risco na rodada ${ev.round + 1}. A torcida rezou.` }
      : { emoji: '😎', titulo: `${ev.nome} vai pro banco depois da noitada`, sub: `Cortado da rodada ${ev.round + 1} pra "recuperar o sono"${ev.subNome ? ` — ${ev.subNome} assumiu a vaga` : ''}. Voltou descansado.` }
  }
  if (ev.tipo === 'expulsao') return { emoji: '🟥', titulo: `${ev.nome} pega ${rod} de gancho`, sub: `Discutiu até com o gandula.${ev.subNome ? ` ${ev.subNome} segurou a bronca na vaga.` : ''}` }
  return { emoji: '🩹', titulo: `${ev.nome} fora por ${rod}`, sub: `Lesão boba no treino.${ev.subNome ? ` ${ev.subNome} ganhou a chance no time.` : ' O clube estuda montar um Departamento Médico…'}` }
}
// sem reserva na posição: NADA trava — vira só esta manchete de zoeira
export function mancheteSemReserva(tipo: EventoTipo, nome: string): { emoji: string; titulo: string; sub: string } {
  if (tipo === 'noitada') return { emoji: '😎', titulo: `${nome} amanhece na resenha e joga assim mesmo`, sub: 'Sem reserva na posição, o técnico fingiu que não viu os óculos escuros.' }
  if (tipo === 'expulsao') return { emoji: '🟥', titulo: `${nome} quase pega gancho por reclamação`, sub: 'O juiz aliviou no relatório — sorte do técnico, que não tinha reserva pra vaga.' }
  return { emoji: '🩹', titulo: `${nome} sente dorzinha e joga no sacrifício`, sub: 'Sem reserva na posição, foi no gelo e na raça. O clube estuda um Departamento Médico…' }
}
