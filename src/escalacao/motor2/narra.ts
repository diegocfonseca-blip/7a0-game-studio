// 🎙️ MOTOR 2D v2 — (F) narração. Só narra EVENTO que o motor registrou: drible com golpe só quando o drible DEU CERTO e o
// golpe foi o que ele usou; espalmada que sai pela linha vira "espalmou… escanteio", nessa ordem. PT e EN na MESMA posição.
// ⛔ Sem frase de pênalti (regra do Diego, 19/09: pênalti tem tela própria) — a cobrança só ganha a frase do resultado.
import type { Evento, TipoEvento } from './tipos'

type Frases = [string[], string[]]
const F: Partial<Record<TipoEvento, Frases>> = {
  saida: [['Rola a bola!', 'Bola no meio, começa o jogo!', 'Apita o juiz, bola rolando!'], ['Kick-off!', 'Ball on the spot, we are under way!', 'The referee blows, we are off!']],
  enfiada: [['{a} enfia pro {b}!', '{a} acha o {b} nas costas da zaga!', 'Passe em profundidade de {a}, {b} na corrida!', '{a} rasga a defesa com um passe pro {b}!'],
    ['{a} slides it through for {b}!', '{a} finds {b} in behind!', 'A ball over the top from {a}, {b} is running!', '{a} splits the defence for {b}!']],
  lancamento: [['{a} lança o {b}!', 'Bola longa de {a} procurando o {b}…', '{a} levanta na direção do {b}!'], ['{a} goes long for {b}!', 'Long ball from {a} looking for {b}…', '{a} lofts it towards {b}!']],
  inversao: [['{a} inverte o jogo pro {b}!', 'Virada de jogo de {a}, bola no {b}!', '{a} muda o lado da jogada!'], ['{a} switches play to {b}!', 'A switch from {a}, {b} picks it up!', '{a} changes the angle of attack!']],
  cruzamento: [['{a} cruza na área!', 'Cruzamento de {a}!', '{a} levanta na área…', 'Bola na área, cruzamento de {a}!'], ['{a} whips it into the box!', 'Cross from {a}!', '{a} hangs it up in the area…', 'In it goes, a cross from {a}!']],
  chutao: [['{a} dá um chutão pra frente!', '{a} tira de qualquer jeito!', 'Bicuda do {a} pra afastar o perigo!'], ['{a} hoofs it clear!', '{a} gets rid of it!', '{a} boots it away from danger!']],
  drible: [['{a} passa pelo {b}!', 'Drible de {a} em cima do {b}!', '{a} deixa o {b} no chão!', '{a} limpa o {b} e segue!'], ['{a} skips past {b}!', '{a} beats {b}!', '{a} leaves {b} on the floor!', '{a} gets away from {b}!']],
  arrancada: [['{a} arranca com a bola!', '{a} acelera pelo campo!', '{a} dispara em velocidade!'], ['{a} bursts forward!', '{a} picks up speed!', '{a} races away with it!']],
  desarme: [['{a} desarma o {b}!', 'Bote certo de {a}!', '{a} toma a bola do {b}!', 'Que desarme de {a}!'], ['{a} tackles {b}!', 'A clean tackle from {a}!', '{a} wins it off {b}!', 'What a tackle from {a}!']],
  carrinho: [['Carrinho de {a}, e limpo!', '{a} vai no carrinho e tira!'], ['A sliding tackle from {a}, clean!', '{a} slides in and wins it!']],
  intercepta: [['{a} intercepta!', '{a} corta o passe!', '{a} lê a jogada e rouba!', 'Antecipação de {a}!'], ['{a} intercepts!', '{a} cuts it out!', '{a} reads it and steals!', 'Great anticipation from {a}!']],
  falta: [['Falta de {a} no {b}.', '{a} derruba o {b}, falta.', 'O juiz marca falta de {a}.'], ['Foul by {a} on {b}.', '{a} brings down {b}, free kick.', 'The referee gives a foul against {a}.']],
  amarelo: [['🟨 Amarelo pro {a}.', '🟨 {a} leva o cartão amarelo.'], ['🟨 Yellow card for {a}.', '🟨 {a} goes into the book.']],
  vermelho: [['🟥 Vermelho! {a} está fora!', '🟥 Segundo amarelo, {a} expulso!'], ['🟥 Red card! {a} is off!', '🟥 Second yellow, {a} is sent off!']],
  impedimento: [['Bandeira levantada: {a} impedido.', 'Impedimento de {a}.', '{a} estava adiantado, impedido.'], ['Flag up: {a} offside.', 'Offside against {a}.', '{a} was too early, offside.']],
  chute: [['{a} bate!', '{a} chuta!', '{a} arrisca!', '{a} solta a bomba!'], ['{a} shoots!', '{a} strikes!', '{a} tries his luck!', '{a} lets fly!']],
  cabeceio: [['{a} sobe de cabeça!', 'Cabeçada de {a}!', '{a} testa firme!'], ['{a} rises for the header!', 'Header from {a}!', '{a} gets his head to it!']],
  defesa: [['Defesa de {a}!', '{a} pega!', 'Que defesa de {a}!'], ['Save by {a}!', '{a} keeps it out!', 'What a save from {a}!']],
  encaixa: [['{a} encaixa firme.', '{a} segura sem dar rebote.', 'Fácil pra {a}.'], ['{a} gathers it.', '{a} holds on, no rebound.', 'Comfortable for {a}.']],
  espalma: [['{a} espalma!', '{a} dá um tapa na bola!', 'Voo de {a}, espalmou!'], ['{a} parries it!', '{a} palms it away!', '{a} flies and pushes it out!']],
  trave: [['Na trave!', 'Explodiu no poste!', 'Tirou tinta da trave!'], ['Off the post!', 'It hits the woodwork!', 'Rattles the post!']],
  fora: [['Pra fora!', 'Passou perto!', 'Raspando a trave, pra fora!'], ['Wide!', 'Just past the post!', 'Inches wide!']],
  isolou: [['Isolou!', 'Por cima do gol!', 'Mandou pra arquibancada!'], ['Over the bar!', 'Blazed over!', 'Into the stands!']],
  bloqueio: [['{a} bloqueia o chute!', 'Travado por {a}!', '{a} se joga na frente da bola!'], ['{a} blocks the shot!', 'Blocked by {a}!', '{a} throws himself in front of it!']],
  gol: [['GOOOOL! {a}!', 'GOOOL de {a}!', 'É GOL! {a} balança a rede!'], ['GOOOAL! {a}!', 'GOAL for {a}!', 'It is in! {a} finds the net!']],
  escanteio: [['Escanteio.', 'Bola pra escanteio.', 'Vai dar escanteio.'], ['Corner.', 'It goes out for a corner.', 'Corner kick.']],
  lateral: [['Lateral.', 'Bola pela lateral.'], ['Throw-in.', 'Out for a throw.']],
  tiro_de_meta: [['Tiro de meta.', 'Bola pela linha de fundo, tiro de meta.'], ['Goal kick.', 'Over the line, goal kick.']],
  corte: [['{a} corta!', '{a} afasta de cabeça!', '{a} tira o perigo!'], ['{a} clears!', '{a} heads it away!', '{a} deals with the danger!']],
  saida_goleiro: [['{a} sai do gol e fica com ela.', '{a} sai bem e segura.'], ['{a} comes out and claims it.', '{a} rushes out and gathers.']],
  intervalo: [['Fim do primeiro tempo.', 'Intervalo!'], ['Half-time.', 'That is the break!']],
  fim: [['Fim de jogo!', 'Apita o árbitro, acabou!'], ['Full time!', 'The referee blows, it is over!']],
  vantagem: [['Lei da vantagem! O juiz deixa seguir.', 'Falta em {b}, mas o árbitro dá a vantagem.', 'Segue o jogo: vantagem pro ataque!'], ['Advantage! The referee lets it go on.', 'Foul on {b}, but the referee plays advantage.', 'Play on: advantage to the attack!']],
  acrescimo: [['⏱️ {a} minuto(s) de acréscimo.', '⏱️ O quarto árbitro mostra: +{a}.', '⏱️ Vão jogar mais {a} minuto(s).'], ['⏱️ {a} minute(s) of added time.', '⏱️ The board goes up: +{a}.', '⏱️ {a} more minute(s) to play.']],
  rebote: [['{a} dá rebote… bola viva na área!', 'Sobrou na frente do gol!', 'Rebote de {a}, perigo!'], ['{a} spills it… loose ball in the box!', 'It drops in front of goal!', 'Rebound off {a}, danger!']],
  cara_a_cara: [['{a} sai pra fechar o ângulo!', 'Cara a cara: {a} fica em pé até o fim!', '{a} sai do gol e encurta o espaço!'], ['{a} comes out to narrow the angle!', 'One on one: {a} stays big!', '{a} rushes out and closes the space!']],
}
// golpe do drible (só quando ELE fez o drible)
const GOLPE_TXT: Record<string, [string, string]> = {
  elastico: ['{a} dá o ELÁSTICO no {b}!', '{a} does the FLIP-FLAP on {b}!'], pedalada: ['Pedalada de {a}, o {b} caiu!', 'Stepovers from {a}, {b} is gone!'],
  chapeu: ['CHAPÉU de {a} no {b}!', '{a} LOBS it over {b}!'], roleta: ['Roleta de {a}, passou pelo {b}!', 'Roulette from {a}, past {b}!'],
  caneta: ['CANETA de {a} no {b}!', 'NUTMEG from {a} on {b}!'], slalom: ['{a} costura a defesa!', '{a} weaves through!'],
  croqueta: ['La croqueta de {a}!', 'La croqueta from {a}!'], corta_pra_dentro: ['{a} corta pra dentro do {b}!', '{a} cuts inside {b}!'],
  cruyff: ['O giro de Cruyff em cima do {b}!', 'The Cruyff turn on {b}!'], drible_goleiro: ['{a} dribla o goleiro!', '{a} rounds the keeper!'],
  // (os jeitos do drible comum — pelo atributo da carta, não por fato da pessoa)
  arrancada: ['{a} joga pra frente e dispara, o {b} ficou pra trás!', '{a} knocks it past {b} and bursts away!'],
  giro: ['{a} protege a bola e gira em cima do {b}!', '{a} shields the ball and spins away from {b}!'],
  corpo: ['Finta de corpo de {a}, o {b} comprou!', 'Body feint from {a}, {b} bought it!'],
}

// 🎯 o jeito do chute (25/10): cobertura, cavadinha, colocado, bomba
const CHUTE_TXT: Record<string, [string, string]> = {
  cobertura: ['{a} vê o goleiro adiantado e tenta a COBERTURA!', '{a} spots the keeper off his line and tries the LOB!'],
  cavadinha: ['CAVADINHA de {a}!', 'A CHIP from {a}!'],
  colocado: ['{a} bate colocado, de três dedos!', '{a} curls one with the outside of the boot!'],
  bomba: ['{a} solta a BOMBA!', '{a} lets fly a ROCKET!'],
  voleio: ['DE VOLEIO, {a}!', 'ON THE VOLLEY, {a}!'],
  bicicleta: ['BICICLETA DE {a}!!!', 'BICYCLE KICK FROM {a}!!!'],
  // (os jeitos do chute comum — pelo que aconteceu no lance)
  de_longe: ['{a} arrisca de longe!', '{a} tries one from distance!'],
  rasteiro: ['{a} bate rasteiro, no canto!', '{a} drills it low into the corner!'],
  cruzado: ['{a} bate cruzado!', '{a} shoots across goal!'],
}
/** 🔁 o recomeço do 2º tempo (sem esta, a faixa ficava em "Intervalo!" com a bola rolando aos 55') */
export const SEGUNDO_TEMPO = [['Começa o segundo tempo!', 'Bola rolando pro segundo tempo!', 'Volta o jogo: segundo tempo!'], ['Second half under way!', 'The ball is rolling again: second half!', 'We are back for the second half!']] as const
export class Narrador {
  private usados = new Map<string, number>()
  private en: boolean
  private r: () => number
  constructor(en: boolean, r: () => number) { this.en = en; this.r = r }
  texto(e: Evento): string | null {
    if (e.tipo === 'drible' && e.golpe && GOLPE_TXT[e.golpe]) return this.pinta(GOLPE_TXT[e.golpe][this.en ? 1 : 0], e)
    if (e.tipo === 'chute' && e.golpe && CHUTE_TXT[e.golpe]) return this.pinta(CHUTE_TXT[e.golpe][this.en ? 1 : 0], e)
    const f = F[e.tipo]
    if (!f) return null
    const lista = f[this.en ? 1 : 0]
    // rodízio: não repete a última frase usada pra esse evento
    const ult = this.usados.get(e.tipo) ?? -1
    let i = Math.floor(this.r() * lista.length)
    if (i === ult && lista.length > 1) i = (i + 1) % lista.length
    this.usados.set(e.tipo, i)
    return this.pinta(lista[i], e)
  }
  /** 🔁 frase SEM sorteio (o sorteio do narrador é o do jogo: sortear aqui mudaria o resto da partida) — `k` escolhe a versão */
  fixo(lista: readonly [readonly string[], readonly string[]], k: number) { const l = lista[this.en ? 1 : 0]; return l[Math.abs(Math.floor(k)) % l.length] }
  private pinta(s: string, e: Evento) { return s.replace('{a}', `<b>${e.a ?? ''}</b>`).replace('{b}', `<b>${e.b ?? ''}</b>`) }
}
/** os eventos que merecem frase na faixa (passe comum não) e a força de cada um (frase forte não é atropelada) */
export const PESO: Partial<Record<TipoEvento, number>> = {
  gol: 9, vermelho: 8, trave: 7, espalma: 7, defesa: 7, encaixa: 6, isolou: 6, fora: 6, bloqueio: 6, chute: 5, cabeceio: 5, amarelo: 5, impedimento: 5,
  drible: 4, enfiada: 4, cruzamento: 4, desarme: 4, carrinho: 4, intercepta: 3, falta: 4, escanteio: 3, lancamento: 3, inversao: 3, arrancada: 3,
  corte: 3, saida_goleiro: 3, chutao: 2, lateral: 1, tiro_de_meta: 1, saida: 2, intervalo: 9, fim: 9, vantagem: 5, acrescimo: 5, rebote: 6, cara_a_cara: 5,
}
