// ─── 🎭 EVENTOS DE JOGADOR (carreira SOLO) — módulo PURO, sem React ────────
// Histórias cômicas com decisão: o baladeiro que sumiu na noitada, o pavio-curto
// expulso, a lesão boba. Regras combinadas com o Diego:
//  · no MÁXIMO 1 evento por temporada, sempre ANTES do fim (rodadas 3..31);
//  · só dispara se EXISTE reserva na posição (senão vira SÓ manchete, nada trava);
//  · 🏥 o Departamento Médico SAIU DO JOGO em 12/09 (ordem do Diego) — lesão é
//    igual pra todo mundo, ninguém é imune;
//  · a troca usa a MESMA vaga (posição igual) — a formação NUNCA quebra;
//  · a suspensão morre na virada da temporada (o titular volta sozinho);
//  · zoeira leve e fictícia SEMPRE — nunca tragédia/lesão real de ninguém.
import type { Sector, EventoTipo } from './types'
import { getLang } from './lang' // 🌐 BR/EN (12/09): a história sai no idioma do site
import { pesoLesao } from './condicao' // 😓 gás: peso do cansado no sorteio da lesão (régua única)

// carta "mínima" que o sorteio precisa (WonCard e PoolCard da tela servem)
// 🪪 club/year existem pra DESEMPATAR XARÁ (ver `traitDe`). São opcionais porque
// quem chama passa a carta inteira (WonCard já tem os dois) — o tipo é que
// escondia isso e fazia o traço casar só pelo nome.
export interface EventoCard { id: string; name: string; pos: Sector; club?: string; year?: number }

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
  'Zlatan Ibrahimović', 'Suárez', 'Luis Suárez', 'Diego Costa', 'Sergio Ramos',
  // 🪪 PEPE VAI COM CLUBE E ANO — e isto é um CONSERTO, não capricho (04/09).
  // O jogador Gustavo Kowalczuk escreveu: contratou o **Pepe do Santos de 1962** e
  // o cara pegou gancho por 3 vermelhos. Ele mesmo achou a causa: *"acredito que
  // isso esteja relacionado ao nome do jogador, pois o famigerado Pepe, jogador
  // português, é conhecido por sua grande quantidade de cartões vermelhos"*.
  // Estava certo. E o tamanho do erro: o Pepe do Santos ganhou o **Prêmio Belfort
  // Duarte em 1966**, dado justamente a quem passa anos SEM NUNCA ser expulso.
  // O jogo pintava o sujeito como o oposto exato do que ele foi.
  // Existem DUAS cartas "Pepe" no baralho e são DUAS PESSOAS: Santos 1962 (o
  // Canhão) e Real Madrid 2012 (o zagueiro português). Só a segunda tem o traço.
  'Pepe|Real Madrid|2012',
  // 🎪 folclóricos inventados
  'Cabeção', 'Cabeção da Vila', 'Bode', 'Girino', 'Barão',
])
// 🪪 XARÁ NÃO HERDA FAMA ALHEIA. A chave pode ser só o NOME (quando não há dúvida)
// ou a carta INTEIRA `Nome|Clube|Ano` (quando duas PESSOAS diferentes dividem o
// nome). Confere primeiro a chave cheia; só cai no nome pelado se ele estiver na
// lista. Assim, pôr um nome qualificado na lista TIRA automaticamente o xará dele.
// (Varri o baralho: dos 6 nomes com traço que têm mais de uma carta, 5 são a MESMA
// pessoa em clubes/anos diferentes — Romário, Neymar, Ronaldinho, Vampeta,
// Casagrande — e nesses o traço vale pras duas cartas mesmo. Só "Pepe" são duas
// pessoas.)
export function traitDe(nome: string, club?: string, year?: number): '🍾 baladeiro' | '🌡️ pavio curto' | null {
  if (club && year != null) {
    const cheia = `${nome}|${club}|${year}`
    if (BALADEIROS.has(cheia)) return '🍾 baladeiro'
    if (PAVIO_CURTO.has(cheia)) return '🌡️ pavio curto'
  }
  if (BALADEIROS.has(nome)) return '🍾 baladeiro'
  if (PAVIO_CURTO.has(nome)) return '🌡️ pavio curto'
  return null
}

// ─── 📜 as histórias (tudo FICÇÃO cômica — {n} = nome do jogador) ──────────
// 🌐 Cada lista tem a irmã _EN com a MESMA quantidade de frases (o sorteio usa o
// índice — lista mais curta num idioma repetiria mais). Tradução pelo SENTIDO.
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
const HIST_NOITADA_EN = [
  '{n} vanished after dinner and showed up to training in SUNGLASSES, yawning. The fitness coach swears he "went to bed early". 😎',
  '{n} was tagged in a photo at 4am — at a "cousin\'s" birthday. His agent says it was "grape juice". 🍾',
  '{n} got the time wrong: thought training was in the afternoon. Yesterday\'s barbecue, according to him, "was just a lunch that ran long". 🍖',
  'The club security guard saw {n} arriving in the back of the sound-system truck. He insists he was "doing community work at the club night". 🪩',
  '{n} posted "water only tonight" at 11pm — and at 5am he was singing live on Instagram. Deleted it later, but the internet never forgets. 📱',
  '{n}\'s rideshare driver rated the trip 1 star: "customer sang the whole club anthem, backwards". 🚗',
  '{n} turned up at the training ground still in party clothes, saying he "just popped in to grab something he forgot". Nobody believed him, not even the forgotten thing. 🕺',
  '{n} was caught ordering pizza to the team hotel at 3am. The pizza arrived. He, at breakfast time, did not. 🍕',
  '{n} swears he was only "hydrating at the bar" — but the tab had more bottles than glasses of water. The club audit couldn\'t make the numbers work. 🧾',
  'The neighbours reported a wall of speakers at {n}\'s house until 6am. He claimed "insomnia with a soundtrack". The building manager did not forgive. 🔊',
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
const HIST_EXPULSAO_EN = [
  '{n} argued with the referee, the linesman and — witnesses swear — the ball boy. Straight red and a 3-page report. 🟥',
  '{n} flying-kicked the ADVERTISING BOARD after the disallowed goal. The board didn\'t fight back, but the referee saw it. 🟥',
  '{n} told the referee to "go study the rules". The referee showed he knows at least one: the red card. 🟥',
  '{n} kicked the ball into the stands in protest — and it came straight back, because a fan returned it on the spot. Red card and a double booing. 🟥',
  '{n} mimicked the referee blowing a pretend whistle after the penalty wasn\'t given. The referee wasn\'t amused and showed a real card. 🟥',
  '{n} ripped off the captain\'s armband and threw it on the ground mid-argument. The referee read it as a "gesture of disrespect" — and he wasn\'t wrong. 🟥',
  '{n} ran 40 metres just to argue a corner that wasn\'t even his. Arrived out of breath, left with a red. 🟥',
  '{n} laughed in the fourth official\'s face after the yellow card. The laugh earned the second one — and an early shower. 🟥',
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
const HIST_LESAO_EN = [
  '{n} felt his muscle go IN THE WARM-UP — before touching the ball. The medical department (which doesn\'t exist) regrets it. 🩹',
  '{n} twisted his ankle rehearsing his goal celebration dance in training. The choreography was beautiful, they say. 🩹',
  '{n} slipped on the dressing-room stairs carrying the ball bag. The balls are fine. He, more or less. 🩹',
  '{n} locked up his back tying his boots. Age comes for everyone — even legends. 🩹',
  '{n} sneezed too hard in the dressing room and felt a twinge in his back. The physio has never seen anything like it. 🤧',
  '{n} stepped on a ball left in the training-ground corridor — literally. The fall went viral in the squad group chat. 🩹',
  '{n} strained his arm taking a selfie with a fan before the game. The shoulder couldn\'t handle the angle. 📸',
  '{n} felt a twinge celebrating a goal in a KICKABOUT on his day off. He swears it "didn\'t count". It counted for 3 weeks in the treatment room. 🩹',
  '{n} did himself a mischief getting off the bus with a boot bag that was way too heavy. The bag won. 🎒',
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
// 🔁 quantas temporadas o mesmo jogador fica de fora depois de aprontar
export const EVENTO_DESCANSO = 5
export const EVENTO_MIN_ROUND = 2
export const EVENTO_MAX_ROUND = 30

// ─── 🎲 o sorteio da temporada (determinístico pela semente) ───────────────
// Uma rodada-alvo por temporada + ~15% das temporadas passam em branco. Ao
// chegar na rodada-alvo (ou depois, se o jogo pulou), sorteia o jogador do XI:
// baladeiro→noitada, pavio→expulsão (peso 4× cada) e qualquer um→lesão (peso 1,
// pesado 2×/3× pelo gás).
export function sorteiaEvento(args: {
  seed: number; seasonNo: number; round: number
  xi: EventoCard[]; squad: EventoCard[]
  // 🔁 histórico: nome do jogador → última temporada em que ELE aprontou.
  // É o que segura o "toda vez o mesmo cara" (relato do Diego).
  hist?: Record<string, number>
  avoidName?: string // (legado) nome do causo da temporada passada — saves antigos sem histórico
  // 😓 CONDIÇÃO (12/09): gás por carta. Quem está NO LIMITE (< 30) entra com peso
  // DOBRADO no sorteio da lesão. Ausente = sorteio igual ao de sempre.
  gas?: Record<string, number>
}): EventoSorteado | null {
  const { seed, seasonNo, round, xi, squad, avoidName, hist, gas } = args
  if (round < EVENTO_MIN_ROUND || round > EVENTO_MAX_ROUND) return null
  const rng = mulberry((seed ^ Math.imul(seasonNo, 2654435761) ^ 0x77AA11) >>> 0)
  if (rng() < 0.15) return null // temporada em branco (nem toda temporada tem causo)
  const alvo = EVENTO_MIN_ROUND + Math.floor(rng() * (EVENTO_MAX_ROUND - EVENTO_MIN_ROUND + 1))
  if (round < alvo) return null
  // candidatos do XI ATUAL (o evento é sempre com um titular seu)
  const pool: { c: EventoCard; tipo: EventoTipo }[] = []
  for (const c of xi) {
    const t = traitDe(c.name, c.club, c.year)
    if (t === '🍾 baladeiro') for (let i = 0; i < 4; i++) pool.push({ c, tipo: 'noitada' })
    if (t === '🌡️ pavio curto') for (let i = 0; i < 4; i++) pool.push({ c, tipo: 'expulsao' })
    // 🥵 no limite = 2× lesão · 🚑 esgotado = 3× (a régua mora em condicao.ts)
    { const peso = gas ? pesoLesao(gas[c.id] ?? 100) : 1; for (let i = 0; i < peso; i++) pool.push({ c, tipo: 'lesao' }) }
  }
  if (!pool.length) return null // 🏥 médico pronto + ninguém folclórico no XI = temporada em paz
  // 🔁 DESCANSO DE 5 TEMPORADAS (regra do Diego, 08/08): quem já aprontou fica
  // FORA do sorteio pelas 5 temporadas seguintes. Antes ele só pulava a temporada
  // seguinte — voltava e aprontava de novo, que foi a queixa ("toda hora que ele
  // voltava, vinha da balada de novo").
  // Se o time tem OUTRO que apronte, o causo vai pra esse outro. Se TODO MUNDO do
  // XI está de descanso, a temporada passa em paz — melhor isso do que repetir.
  const descansando = (nome: string) => {
    const ultima = hist?.[nome]
    if (ultima != null) return seasonNo - ultima < EVENTO_DESCANSO
    return avoidName === nome // save antigo sem histórico: pelo menos não repete seguido
  }
  const poolFinal = pool.filter(p => !descansando(p.c.name))
  if (!poolFinal.length) return null
  const pick = poolFinal[Math.floor(rng() * poolFinal.length)]
  const rodadas = pick.tipo === 'noitada' ? 1 : pick.tipo === 'expulsao' ? 1 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 5)
  const en = getLang() === 'en'
  const textos = pick.tipo === 'noitada' ? (en ? HIST_NOITADA_EN : HIST_NOITADA) : pick.tipo === 'expulsao' ? (en ? HIST_EXPULSAO_EN : HIST_EXPULSAO) : (en ? HIST_LESAO_EN : HIST_LESAO)
  const historia = textos[Math.floor(rng() * textos.length)].replace('{n}', pick.c.name)
  const xiIds = new Set(xi.map(c => c.id))
  // reserva = MESMA posição, fora do XI (cria e emprestado valem — estão no elenco e jogam)
  const reservas = squad.filter(c => c.pos === pick.c.pos && !xiIds.has(c.id))
  return { tipo: pick.tipo, card: pick.c, rodadas, historia, reservas }
}

// ─── 🩹 histórias da LESÃO POR DESGASTE ({n} = nome · {j} = jogos seguidos) ──
// Diferente da lesão boba: aqui a culpa é do técnico que não rodiziou — a zoeira
// aponta pra isso. Mesma quantidade PT/EN.
const HIST_DESGASTE = [
  'O {n} sentiu a coxa aos 10 minutos — {j}º jogo seguido sem descanso. O preparador só olhou pro banco e balançou a cabeça. 🩹',
  'O {n} pediu pra sair mancando. "Eu avisei que ele tava no talo", disse o preparador, pra quem quisesse ouvir. 🩹',
  'O {n} travou no alongamento: o corpo pediu arrego depois de {j} jogos seguidos. O fisioterapeuta já tinha a maca pronta. 🩹',
  'Puxou o músculo do {n} num pique bobo. A torcida cantou "descansa, meu filho" — e o técnico fingiu que não ouviu. 🩹',
  'O {n} caiu sozinho, sem ninguém por perto. Laudo do departamento: "cansaço acumulado ({j} jogos seguidos)". 🩹',
]
const HIST_DESGASTE_EN = [
  '{n} felt his thigh go after 10 minutes — {j}th match in a row without a rest. The fitness coach just looked at the bench and shook his head. 🩹',
  '{n} asked to come off limping. "I warned you he was running on fumes," said the fitness coach, to anyone who would listen. 🩹',
  '{n} seized up in the stretch: the body waved the white flag after {j} straight matches. The physio already had the stretcher ready. 🩹',
  '{n} pulled a muscle in a nothing sprint. The crowd sang "give him a rest" — and the manager pretended not to hear. 🩹',
  '{n} went down on his own, nobody near him. Medical report: "accumulated fatigue ({j} matches in a row)". 🩹',
]
export function historiaDesgaste(nome: string, jogos: number, seed: number): string {
  const lista = getLang() === 'en' ? HIST_DESGASTE_EN : HIST_DESGASTE
  return lista[Math.abs(seed) % lista.length].replace('{n}', nome).replace(/\{j\}/g, String(jogos))
}

// ─── 📰 manchetes pro jornal (página "Aconteceu na temporada") ─────────────
export function eventoEmoji(tipo: EventoTipo): string { return tipo === 'noitada' ? '😎' : tipo === 'expulsao' ? '🟥' : '🩹' }
export function eventoTituloBanner(tipo: EventoTipo, rodadas: number, desgaste = false): string {
  const en = getLang() === 'en'
  if (tipo === 'noitada') return en ? '🚨 DRESSING-ROOM TROUBLE' : '🚨 PROBLEMA NO VESTIÁRIO'
  if (tipo === 'expulsao') return en ? `🟥 SENT OFF — ${rodadas}-ROUND BAN` : `🟥 EXPULSO — PEGOU ${rodadas} ${rodadas === 1 ? 'RODADA' : 'RODADAS'}`
  if (desgaste) return en ? `😓 WORN OUT — OUT ${rodadas} ${rodadas === 1 ? 'ROUND' : 'ROUNDS'}` : `😓 LESÃO POR DESGASTE — FORA ${rodadas} ${rodadas === 1 ? 'RODADA' : 'RODADAS'}`
  return en ? `🩹 INJURED — OUT ${rodadas} ${rodadas === 1 ? 'ROUND' : 'ROUNDS'}` : `🩹 LESIONADO — FORA ${rodadas} ${rodadas === 1 ? 'RODADA' : 'RODADAS'}`
}
export function mancheteDecisao(ev: { tipo: EventoTipo; nome: string; rodadas: number; status: string; subNome?: string; round: number; desgaste?: boolean }): { emoji: string; titulo: string; sub: string } {
  const en = getLang() === 'en'
  const rod = en ? `${ev.rodadas} ${ev.rodadas === 1 ? 'round' : 'rounds'}` : `${ev.rodadas} ${ev.rodadas === 1 ? 'rodada' : 'rodadas'}`
  if (ev.tipo === 'noitada') {
    if (en) {
      return ev.status === 'campo'
        ? { emoji: '😎', titulo: `${ev.nome} plays "on coffee alone" after a night out`, sub: `The manager backed the selection at his own risk in round ${ev.round + 1}. The fans prayed.` }
        : { emoji: '😎', titulo: `${ev.nome} benched after the night out`, sub: `Dropped from round ${ev.round + 1} to "catch up on sleep"${ev.subNome ? ` — ${ev.subNome} took the spot` : ''}. Came back rested.` }
    }
    return ev.status === 'campo'
      ? { emoji: '😎', titulo: `${ev.nome} joga "na base do café" após noitada`, sub: `O técnico bancou a escalação por conta e risco na rodada ${ev.round + 1}. A torcida rezou.` }
      : { emoji: '😎', titulo: `${ev.nome} vai pro banco depois da noitada`, sub: `Cortado da rodada ${ev.round + 1} pra "recuperar o sono"${ev.subNome ? ` — ${ev.subNome} assumiu a vaga` : ''}. Voltou descansado.` }
  }
  if (ev.tipo === 'expulsao') {
    if (en) return { emoji: '🟥', titulo: `${ev.nome} gets a ${rod} ban`, sub: `Argued with the ball boy, even.${ev.subNome ? ` ${ev.subNome} held the fort in his place.` : ''}` }
    return { emoji: '🟥', titulo: `${ev.nome} pega ${rod} de gancho`, sub: `Discutiu até com o gandula.${ev.subNome ? ` ${ev.subNome} segurou a bronca na vaga.` : ''}` }
  }
  if (ev.desgaste) {
    if (en) return { emoji: '😓', titulo: `${ev.nome} breaks down: out for ${rod}`, sub: `Too many matches in a row — the body sent the bill.${ev.subNome ? ` ${ev.subNome} got his chance in the team.` : ''}` }
    return { emoji: '😓', titulo: `${ev.nome} não aguenta: fora por ${rod}`, sub: `Jogos demais seguidos — o corpo mandou a conta.${ev.subNome ? ` ${ev.subNome} ganhou a chance no time.` : ''}` }
  }
  if (en) return { emoji: '🩹', titulo: `${ev.nome} out for ${rod}`, sub: `Silly injury in training.${ev.subNome ? ` ${ev.subNome} got his chance in the team.` : ''}` }
  return { emoji: '🩹', titulo: `${ev.nome} fora por ${rod}`, sub: `Lesão boba no treino.${ev.subNome ? ` ${ev.subNome} ganhou a chance no time.` : ''}` }
}
// sem reserva na posição: NADA trava — vira só esta manchete de zoeira
export function mancheteSemReserva(tipo: EventoTipo, nome: string): { emoji: string; titulo: string; sub: string } {
  const en = getLang() === 'en'
  if (tipo === 'noitada') return en
    ? { emoji: '😎', titulo: `${nome} rolls in from the party and plays anyway`, sub: 'No backup for the position, so the manager pretended not to see the sunglasses.' }
    : { emoji: '😎', titulo: `${nome} amanhece na resenha e joga assim mesmo`, sub: 'Sem reserva na posição, o técnico fingiu que não viu os óculos escuros.' }
  if (tipo === 'expulsao') return en
    ? { emoji: '🟥', titulo: `${nome} nearly gets banned for dissent`, sub: 'The referee went easy in the report — lucky for the manager, who had no backup for the spot.' }
    : { emoji: '🟥', titulo: `${nome} quase pega gancho por reclamação`, sub: 'O juiz aliviou no relatório — sorte do técnico, que não tinha reserva pra vaga.' }
  return en
    ? { emoji: '🩹', titulo: `${nome} feels a niggle and plays through it`, sub: 'No backup for the position, so it was ice and guts.' }
    : { emoji: '🩹', titulo: `${nome} sente dorzinha e joga no sacrifício`, sub: 'Sem reserva na posição, foi no gelo e na raça.' }
}
