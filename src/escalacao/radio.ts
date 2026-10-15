// ─── 📻 RÁDIO LEGENDS — uma frase dentro do placar, o jogo inteiro (módulo puro) ──
//
// Diego (13/10), aprovando o mockup `scripts/mockups/radio-no-placar.png`: *"pode fazer isso aí! e coloque muita coisa
// variada… porque tem milhares de jogos, não quero toda hora repetições"*. Antes ele tinha achado rádio em CAIXA +
// termômetro informação demais (*"tem a tática, a tabela, os jogos…"*) — então é UMA linha só, dentro do placar,
// trocando sozinha a cada lance. Termômetro ficou de fora.
//
// O que a rádio narra: o "resto" do jogo — falta, cartão, escanteio, impedimento, drible, toque de bola, torcida,
// banco, juiz, goleiro repondo, contra-ataque cortado, clima. O que ela NUNCA narra:
//   · ⚽ GOL — o gol é do placar (lance grande + mascote). A rádio nem chega perto do minuto dele (±3′).
//   · 🥅 CHANCE perdida — já tem o golzinho com a narração própria (`chances.ts`). Também fica a ±3′ dela.
//     (Régua do Diego de 21/09: o mesmo teatro não aparece duas vezes.)
//   · 🚫 PÊNALTI — ordem de 19/09: pênalti tem tela própria.
//   · 🧑 DONO do clube — é gente de verdade.
// 🔁 JOGADOR PELO NOME (14/10, Diego: *"na rádio tinha que falar os jogadores e não somente do time… goleiro do Leão
//   tinha que falar o nome do goleiro"*). Quando o placar sabe a escalação (`elencos`), o lance que tem um dono natural
//   (goleiro, zagueiro, meia, atacante, lateral) usa a versão COM NOME (`NOMEADO`), sorteando alguém DAQUELA posição do
//   time certo. Sem escalação, ou sem ninguém de verdade na posição (carta fake/Várzea), volta a frase do clube.
//   · 🙈 PLACAR — nenhuma frase diz quem está ganhando: nunca entrega nada antes da hora.
//
// VARIEDADE (o pedido): cada frase é ABERTURA + LANCE + FECHO, sorteados em separado, mais o nome dos dois clubes.
// Dentro de um jogo nenhum LANCE se repete; entre jogos, a semente muda. Ver a conta em `npm run radio`.
// 🎲 DETERMINÍSTICO: semente da rodada + clubes → a sala inteira ouve a mesma rádio no mesmo minuto.
// 🌐 PT e EN andam juntos (par por par), então o sorteio vale pros dois idiomas.

type Par = [pt: string, en: string]
export type RadioLance = { min: number; i: number; a: number; f: number; home: boolean }

function mulberry(seed: number) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// ⏱️ quanto tempo uma frase precisa ficar na tela pra dar tempo de ler
export const RADIO_LER_MS = 2200
/** quantas frases cabem num jogo de `roundMs` (online 16s ≈ 5 · carreira ≈ 4 · rodada instantânea = 0) */
export function frasesPorJogo(roundMs: number, max = 9): number {
  const dur = Math.max(400, roundMs * 0.82)
  return Math.max(0, Math.min(max, Math.floor(dur / RADIO_LER_MS)))
}

// {t} = clube do lance · {o} = o outro clube
const ABRE: Par[] = [
  ['', ''], ['', ''], ['', ''], ['', ''], // sem abertura também é jeito de narrar
  ['Olha lá: ', 'Look at that: '], ['Atenção: ', 'Heads up: '], ['Que isso! ', 'What is this! '], ['Vai, vai… ', 'Go, go… '],
  ['Ih, rapaz: ', 'Oh boy: '], ['Segura! ', 'Hold on! '], ['Lá vem: ', 'Here it comes: '], ['E agora, ', 'And now, '],
  ['Pois é, ', 'Well, '], ['Repara: ', 'Notice this: '], ['Atenção, torcedor: ', 'Listen up, fans: '], ['Aqui na Rádio Legends: ', 'Here on Radio Legends: '],
  ['Rápido: ', 'Quickly: '], ['Que jogo: ', 'What a game: '], ['Minha nossa: ', 'Good heavens: '], ['Escuta essa: ', 'Listen to this: '],
]
const FECHA: Par[] = [
  ['', ''], ['', ''], ['', ''], ['', ''],
  [' A torcida reclama.', ' The crowd complains.'], [' Segue o jogo.', ' Play on.'], [' O estádio ferve.', ' The stadium is boiling.'],
  [' Jogo pegado!', ' A tight one!'], [' Que ritmo.', ' What a pace.'], [' A arquibancada canta.', ' The stands are singing.'],
  [' O banco levanta.', ' The bench is on its feet.'], [' Ninguém tira o olho.', ' Nobody looks away.'], [' Coisa de clássico.', ' Derby stuff.'],
  [' Anota aí.', ' Write that down.'], [' Tá quente!', ' It is heating up!'], [' Que coisa.', ' Unbelievable.'],
]
// LANCES — nenhum fala de gol, chance de gol, pênalti, placar ou jogador. {t} sempre é quem faz; {o} o outro.
const LANCES: Par[] = [
  // falta / cartão
  ['falta dura do {t} no meio-campo, e o juiz apita na hora', 'a hard foul by {t} in midfield, and the ref blows straight away'],
  ['carrinho do {t} que arranca grama. Amarelo!', 'a sliding tackle by {t} that tears up the turf. Yellow!'],
  ['o {t} para o contra-ataque com falta tática. Cartão amarelo', '{t} stop the counter with a tactical foul. Yellow card'],
  ['empurra-empurra entre {t} e {o}, o juiz corre pra separar', 'pushing and shoving between {t} and {o}, the ref rushes in to separate them'],
  ['o {t} reclama de tudo e o juiz já mostra o dedo', '{t} complain about everything and the ref wags a finger'],
  ['falta boba do {t} na lateral, bola parada pro {o}', 'a silly foul by {t} on the touchline, set piece for {o}'],
  ['o juiz deixa seguir, vantagem pro {t}', 'the ref waves play on, advantage {t}'],
  ['cotovelada no alto, o {o} pede cartão e o juiz só conversa', 'a high elbow, {o} want a card and the ref just has a word'],
  ['o {t} cava a falta na intermediária com muita malandragem', '{t} win a free kick in midfield with plenty of street smarts'],
  ['amarelo pro {t} por reclamação. Calma, gente', 'a yellow for {t} for dissent. Easy now'],
  ['o {t} faz a falta e ainda sai reclamando do gramado', '{t} commit the foul and walk off blaming the pitch'],
  ['trombada no meio-campo, os dois ficam no chão e a maca nem precisa entrar', 'a collision in midfield, both go down and the stretcher is not even needed'],
  // escanteio / bola parada / defesa
  ['escanteio pro {t}… a zaga do {o} afasta de cabeça', 'corner for {t}… the {o} defence heads it clear'],
  ['cobrança de falta do {t} na barreira. Doeu!', 'a {t} free kick straight into the wall. That hurt!'],
  ['lateral comprido do {t} na área, a defesa tira de qualquer jeito', 'a long throw from {t} into the box, cleared any way possible'],
  ['o {o} rebate de bicicleta pra longe da área. Coragem', '{o} clear it away with an overhead kick. Brave'],
  ['corte providencial da zaga do {o} em cima da linha da grande área', 'a timely block by the {o} defence right on the edge of the box'],
  ['o {t} cobra o escanteio curto e roda a bola de novo', '{t} play the corner short and recycle possession'],
  ['bola alçada pelo {t}, o goleiro do {o} sai e soca pra frente', 'a ball lofted in by {t}, the {o} keeper comes out and punches it away'],
  ['o {o} faz a linha de impedimento perfeita, e o {t} cai nela', '{o} hold a perfect offside line and {t} walk right into it'],
  ['impedimento marcado contra o {t}. Foi por um fio de cabelo', 'offside given against {t}. By a whisker'],
  ['bandeirinha sobe: impedimento do {t}, e a torcida vaia', 'the flag goes up: {t} offside, and the crowd boos'],
  ['a zaga do {o} ganha tudo pelo alto. Que muralha', 'the {o} defence wins everything in the air. What a wall'],
  ['o {o} faz o desarme limpo e sai jogando', '{o} make a clean tackle and play out from the back'],
  // ataque sem finalização / dribles
  ['drible da vaca do {t} na lateral. O marcador ainda procura a bola', '{t} nutmeg-and-go on the flank. The defender is still looking for the ball'],
  ['caneta do {t} no meio-campo, a arquibancada vai ao delírio', 'a nutmeg by {t} in midfield, the stands go wild'],
  ['o {t} tabela pela direita e o cruzamento sai forte demais', '{t} play a one-two down the right and the cross is overhit'],
  ['contra-ataque do {t}… cortado na hora certa pelo {o}', 'counter-attack by {t}… cut out at the right moment by {o}'],
  ['o {t} troca vinte passes seguidos. Olé na arquibancada', '{t} string twenty passes together. Olé from the stands'],
  ['lançamento longo do {t}, a bola corre demais e sai pela linha de fundo', 'a long ball from {t} runs away and goes out over the byline'],
  ['o {t} enfileira dois marcadores e é parado no terceiro', '{t} go past two defenders and are stopped by the third'],
  ['chapéu do {t} na intermediária! Que categoria', 'a flick over the head by {t} in midfield! What class'],
  ['o {t} gira o jogo de um lado pro outro procurando espaço', '{t} switch play from side to side looking for space'],
  ['o {t} tenta a enfiada, e o {o} lê a jogada antes', '{t} try the through ball, and {o} read it first'],
  ['arrancada do {t} desde o próprio campo. Fôlego de cavalo', 'a surging run by {t} from their own half. Lungs of a horse'],
  ['o {t} prende a bola na bandeirinha de escanteio. Malandragem', '{t} shield the ball by the corner flag. Gamesmanship'],
  ['passe de calcanhar do {t} no meio, e o {o} fica olhando', 'a backheel pass by {t} in midfield, and {o} just watch'],
  ['o {t} toca, toca e não acha ninguém livre', '{t} pass and pass and find nobody free'],
  ['pedalada do {t} na frente do marcador. Show', 'stepovers by {t} in front of the defender. Showtime'],
  ['o {t} sobe a marcação e o {o} se enrola na saída de bola', '{t} press high and {o} get tangled playing out'],
  ['o {o} rouba a bola no meio e acelera o jogo', '{o} win it back in midfield and speed things up'],
  ['bola longa do {o} no peito do atacante, e a zaga do {t} chega junto', 'a long ball from {o} onto the striker\'s chest, and the {t} defence gets tight'],
  // goleiro
  ['o goleiro do {t} sai jogando com os pés. Coração na boca', 'the {t} keeper plays it out with his feet. Hearts in mouths'],
  ['o goleiro do {t} dá um chutão que vai até a outra área', 'the {t} keeper launches one all the way to the other box'],
  ['o goleiro do {o} segura a bola e esfria o jogo', 'the {o} keeper holds the ball and slows the game down'],
  ['o goleiro do {t} reclama da barreira, ninguém escuta', 'the {t} keeper shouts at the wall, nobody listens'],
  ['saída rápida do goleiro do {t} com a mão, contra-ataque armado', 'quick throw out by the {t} keeper, the counter is on'],
  // banco / técnico / juiz
  ['o técnico do {t} gesticula feito maestro na beira do campo', 'the {t} manager conducts like a maestro on the touchline'],
  ['o banco do {t} pede calma, a torcida pede raça', 'the {t} bench asks for calm, the crowd asks for fight'],
  ['o técnico do {o} manda o time inteiro subir', 'the {o} manager sends the whole team forward'],
  ['o quarto árbitro conversa com o banco do {t}. Clima tenso', 'the fourth official has words with the {t} bench. Tense mood'],
  ['o técnico do {t} chuta a garrafinha de água. Tá bravo', 'the {t} manager kicks a water bottle. Not happy'],
  ['parada técnica: o {t} reúne todo mundo na lateral', 'a break in play: {t} huddle up on the touchline'],
  ['o juiz para o jogo pra atendimento médico no {o}. Nada grave', 'the ref stops play for treatment on {o}. Nothing serious'],
  ['o {o} pede mudança no time e o técnico desenha a jogada na prancheta', '{o} want a change and the manager draws it up on the clipboard'],
  ['o juiz confere o relógio, e o {t} pede pressa', 'the ref checks his watch, and {t} want urgency'],
  ['o técnico do {o} cruza os braços e só observa', 'the {o} manager folds his arms and just watches'],
  // torcida / estádio / clima
  ['a torcida do {t} canta sem parar. Arrepia', 'the {t} fans sing nonstop. Goosebumps'],
  ['mosaico na arquibancada do {t}. Que festa', 'a mosaic in the {t} stand. What a party'],
  ['a torcida do {o} responde à altura, ninguém se cala', 'the {o} fans answer back, nobody is going quiet'],
  ['bola na arquibancada, o torcedor do {t} devolve de primeira', 'ball into the stands, a {t} fan sends it back first time'],
  ['ola na arquibancada! O {t} se empolga junto', 'a Mexican wave in the stands! {t} get carried along'],
  ['começa a garoar e o gramado fica rápido pro {t}', 'it starts to drizzle and the pitch quickens up for {t}'],
  ['um cachorro invade o campo e dá trabalho pro {o}. Já saiu', 'a dog runs onto the pitch and gives {o} a hard time. He is gone now'],
  ['sinalizador na torcida do {t}, fumaça vermelha no estádio', 'a flare in the {t} end, red smoke over the stadium'],
  ['a charanga do {t} não para nem pra respirar', 'the {t} band does not stop for breath'],
  ['vento contra o {t} nesse tempo, a bola não obedece', 'the wind is against {t} this half, the ball will not behave'],
  ['bandeirão subindo na torcida do {o}', 'a giant flag goes up in the {o} end'],
  ['a torcida do {t} grita olé a cada toque', 'the {t} fans shout olé at every touch'],
  ['o gramado tá pesado, o {t} sente nas pernas', 'the pitch is heavy, {t} feel it in their legs'],
  ['refletor pisca, susto rápido, e o {t} nem liga', 'a floodlight flickers, a quick scare, and {t} do not care'],
]
/** carta que a rádio pode citar: nome + posição (GOL/LAT/ZAG/MEI/ATA). `sec` é o nome da posição nas copas. */
export type CartaRadio = { name: string; pos?: string; sec?: string; club?: string; fake?: boolean }
type Nomeado = [pt: string, en: string, pos: 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA', quem: 't' | 'o']
// a versão COM JOGADOR de cada lance (chave = o texto PT da versão do clube). {p} = o jogador, do time `quem`.
const NOMEADO: Record<string, Nomeado> = {
  'falta dura do {t} no meio-campo, e o juiz apita na hora': ['falta dura de {p}, do {t}, no meio-campo, e o juiz apita na hora', 'a hard foul by {p} of {t} in midfield, and the ref blows straight away', 'MEI', 't'],
  'carrinho do {t} que arranca grama. Amarelo!': ['carrinho de {p} que arranca grama. Amarelo pro {t}!', 'a sliding tackle by {p} that tears up the turf. Yellow for {t}!', 'ZAG', 't'],
  'o {t} para o contra-ataque com falta tática. Cartão amarelo': ['{p} para o contra-ataque com falta tática. Amarelo pro {t}', '{p} stops the counter with a tactical foul. Yellow for {t}', 'MEI', 't'],
  'falta boba do {t} na lateral, bola parada pro {o}': ['falta boba de {p} na lateral, bola parada pro {o}', 'a silly foul by {p} on the touchline, set piece for {o}', 'LAT', 't'],
  'o {t} cava a falta na intermediária com muita malandragem': ['{p} cava a falta na intermediária pro {t} com muita malandragem', '{p} wins a free kick in midfield for {t} with plenty of street smarts', 'ATA', 't'],
  'amarelo pro {t} por reclamação. Calma, gente': ['amarelo pra {p}, do {t}, por reclamação. Calma, gente', 'a yellow for {p} of {t} for dissent. Easy now', 'ZAG', 't'],
  'escanteio pro {t}… a zaga do {o} afasta de cabeça': ['escanteio pro {t}… {p} sobe e afasta de cabeça pro {o}', 'corner for {t}… {p} rises and heads it clear for {o}', 'ZAG', 'o'],
  'cobrança de falta do {t} na barreira. Doeu!': ['{p} cobra a falta pro {t} e acerta a barreira. Doeu!', '{p} takes the free kick for {t} straight into the wall. That hurt!', 'MEI', 't'],
  'lateral comprido do {t} na área, a defesa tira de qualquer jeito': ['{p} cobra o lateral comprido do {t} na área, a defesa tira de qualquer jeito', '{p} hurls a long throw from {t} into the box, cleared any way possible', 'LAT', 't'],
  'o {o} rebate de bicicleta pra longe da área. Coragem': ['{p} rebate de bicicleta pra longe da área do {o}. Coragem', '{p} clears it away with an overhead kick for {o}. Brave', 'ZAG', 'o'],
  'corte providencial da zaga do {o} em cima da linha da grande área': ['corte providencial de {p}, do {o}, em cima da linha da grande área', 'a timely block by {p} of {o} right on the edge of the box', 'ZAG', 'o'],
  'bola alçada pelo {t}, o goleiro do {o} sai e soca pra frente': ['bola alçada pelo {t}, {p} sai da meta do {o} e soca pra frente', 'a ball lofted in by {t}, {p} comes off the {o} line and punches it away', 'GOL', 'o'],
  'impedimento marcado contra o {t}. Foi por um fio de cabelo': ['impedimento de {p}, do {t}. Foi por um fio de cabelo', '{p} of {t} flagged offside. By a whisker', 'ATA', 't'],
  'bandeirinha sobe: impedimento do {t}, e a torcida vaia': ['bandeirinha sobe: {p} impedido, e a torcida do {t} vaia', 'the flag goes up: {p} offside, and the {t} crowd boos', 'ATA', 't'],
  'o {o} faz o desarme limpo e sai jogando': ['{p} faz o desarme limpo e o {o} sai jogando', '{p} makes a clean tackle and {o} play out from the back', 'ZAG', 'o'],
  'drible da vaca do {t} na lateral. O marcador ainda procura a bola': ['drible da vaca de {p}, do {t}, na lateral. O marcador ainda procura a bola', '{p} of {t} goes round his man on the flank. The defender is still looking for the ball', 'ATA', 't'],
  'caneta do {t} no meio-campo, a arquibancada vai ao delírio': ['caneta de {p} no meio-campo, a arquibancada do {t} vai ao delírio', 'a nutmeg by {p} in midfield, the {t} stands go wild', 'MEI', 't'],
  'o {t} tabela pela direita e o cruzamento sai forte demais': ['{p} tabela pela direita e o cruzamento do {t} sai forte demais', '{p} plays a one-two down the right and the {t} cross is overhit', 'LAT', 't'],
  'o {t} enfileira dois marcadores e é parado no terceiro': ['{p}, do {t}, enfileira dois marcadores e é parado no terceiro', '{p} of {t} goes past two defenders and is stopped by the third', 'ATA', 't'],
  'chapéu do {t} na intermediária! Que categoria': ['chapéu de {p} na intermediária! Que categoria do {t}', 'a flick over the head by {p} in midfield! {t} class', 'MEI', 't'],
  'arrancada do {t} desde o próprio campo. Fôlego de cavalo': ['arrancada de {p} desde o campo do {t}. Fôlego de cavalo', 'a surging run by {p} from the {t} half. Lungs of a horse', 'LAT', 't'],
  'o {t} prende a bola na bandeirinha de escanteio. Malandragem': ['{p} prende a bola na bandeirinha de escanteio. Malandragem do {t}', '{p} shields the ball by the corner flag. {t} gamesmanship', 'ATA', 't'],
  'passe de calcanhar do {t} no meio, e o {o} fica olhando': ['passe de calcanhar de {p}, do {t}, e o {o} fica olhando', 'a backheel pass by {p} of {t}, and {o} just watch', 'MEI', 't'],
  'pedalada do {t} na frente do marcador. Show': ['pedalada de {p}, do {t}, na frente do marcador. Show', 'stepovers by {p} of {t} in front of the defender. Showtime', 'ATA', 't'],
  'o {o} rouba a bola no meio e acelera o jogo': ['{p} rouba a bola no meio e o {o} acelera o jogo', '{p} wins it back in midfield and {o} speed things up', 'MEI', 'o'],
  'bola longa do {o} no peito do atacante, e a zaga do {t} chega junto': ['bola longa do {o} no peito de {p}, e a zaga do {t} chega junto', 'a long ball from {o} onto the chest of {p}, and the {t} defence gets tight', 'ATA', 'o'],
  'o goleiro do {t} sai jogando com os pés. Coração na boca': ['{p}, goleiro do {t}, sai jogando com os pés. Coração na boca', '{p}, the {t} keeper, plays it out with his feet. Hearts in mouths', 'GOL', 't'],
  'o goleiro do {t} dá um chutão que vai até a outra área': ['{p}, goleiro do {t}, dá um chutão que vai até a outra área', '{p}, the {t} keeper, launches one all the way to the other box', 'GOL', 't'],
  'o goleiro do {o} segura a bola e esfria o jogo': ['{p}, goleiro do {o}, segura a bola e esfria o jogo', '{p}, the {o} keeper, holds the ball and slows the game down', 'GOL', 'o'],
  'o goleiro do {t} reclama da barreira, ninguém escuta': ['{p}, goleiro do {t}, reclama da barreira, ninguém escuta', '{p}, the {t} keeper, shouts at the wall, nobody listens', 'GOL', 't'],
  'saída rápida do goleiro do {t} com a mão, contra-ataque armado': ['saída rápida de {p}, goleiro do {t}, com a mão: contra-ataque armado', 'quick throw out by {p}, the {t} keeper: the counter is on', 'GOL', 't'],
  'empurra-empurra entre {t} e {o}, o juiz corre pra separar': ['empurra-empurra entre {t} e {o}, {p} no meio da confusão e o juiz corre pra separar', 'pushing and shoving between {t} and {o}, {p} in the middle of it and the ref rushes in', 'ZAG', 't'],
  'o {t} reclama de tudo e o juiz já mostra o dedo': ['{p} reclama de tudo pelo {t} e o juiz já mostra o dedo', '{p} complains about everything for {t} and the ref wags a finger', 'MEI', 't'],
  'cotovelada no alto, o {o} pede cartão e o juiz só conversa': ['cotovelada no alto em {p}, o {o} pede cartão e o juiz só conversa', 'a high elbow on {p}, {o} want a card and the ref just has a word', 'ATA', 'o'],
  'o {t} faz a falta e ainda sai reclamando do gramado': ['{p} faz a falta pelo {t} e ainda sai reclamando do gramado', '{p} commits the foul for {t} and walks off blaming the pitch', 'ZAG', 't'],
  'o {t} cobra o escanteio curto e roda a bola de novo': ['{p} cobra o escanteio curto e o {t} roda a bola de novo', '{p} plays the corner short and {t} recycle possession', 'MEI', 't'],
  'a zaga do {o} ganha tudo pelo alto. Que muralha': ['{p} ganha tudo pelo alto na zaga do {o}. Que muralha', '{p} wins everything in the air for the {o} defence. What a wall', 'ZAG', 'o'],
  'contra-ataque do {t}… cortado na hora certa pelo {o}': ['contra-ataque do {t}… {p} corta na hora certa pelo {o}', 'counter-attack by {t}… {p} cuts it out at the right moment for {o}', 'ZAG', 'o'],
  'lançamento longo do {t}, a bola corre demais e sai pela linha de fundo': ['lançamento longo de {p}, do {t}, a bola corre demais e sai pela linha de fundo', 'a long ball from {p} of {t} runs away and goes out over the byline', 'MEI', 't'],
  'o {t} tenta a enfiada, e o {o} lê a jogada antes': ['{p} tenta a enfiada pelo {t}, e o {o} lê a jogada antes', '{p} tries the through ball for {t}, and {o} read it first', 'MEI', 't'],
  'o {t} sobe a marcação e o {o} se enrola na saída de bola': ['{p} sobe a marcação pelo {t} e o {o} se enrola na saída de bola', '{p} presses high for {t} and {o} get tangled playing out', 'ATA', 't'],
  'o {t} gira o jogo de um lado pro outro procurando espaço': ['{p} gira o jogo do {t} de um lado pro outro procurando espaço', '{p} switches play for {t} from side to side looking for space', 'MEI', 't'],
  'o juiz para o jogo pra atendimento médico no {o}. Nada grave': ['o juiz para o jogo pra atendimento médico em {p}, do {o}. Nada grave', 'the ref stops play for treatment on {p} of {o}. Nothing serious', 'ATA', 'o'],
  'o {t} troca vinte passes seguidos. Olé na arquibancada': ['o {t} troca vinte passes seguidos, com {p} regendo. Olé na arquibancada', '{t} string twenty passes together, with {p} conducting. Olé from the stands', 'MEI', 't'],
}
// carta de mentira (filler da Várzea/Pickup) nunca é citada — mesma régua do `ehFake` da súmula
const deVerdade = (c: CartaRadio) => !c.fake && c.club !== 'Várzea' && c.club !== 'Pickup' && !!c.name
/** quem a rádio cita: alguém da posição pedida, sempre o MESMO pra mesma frase (sala inteira ouve igual) */
function quemCitar(lista: CartaRadio[] | undefined, pos: string, l: RadioLance): string | null {
  let daPos = (lista ?? []).filter(c => (c.pos ?? c.sec) === pos && deVerdade(c))
  // 👑 Kings (futebol 7) não tem lateral: a frase de lateral cita um zagueiro
  if (!daPos.length && pos === 'LAT') daPos = (lista ?? []).filter(c => (c.pos ?? c.sec) === 'ZAG' && deVerdade(c))
  if (!daPos.length) return null
  return daPos[(l.min * 31 + l.a * 7 + l.f) % daPos.length].name
}

// 👑 FRASES DA KINGS LEAGUE (15/10): o que acontece numa partida da Kings e não acontece num jogo comum. `c` = versão do
// clube; `p` = versão com o jogador ({p}) da posição `pos`, do time `quem` (t = quem faz · o = o outro). Nada de gol,
// chance, pênalti (tem tela própria) nem placar — mesmas regras do resto da rádio.
type FraseKings = { c: Par; p?: Par; pos?: 'GOL' | 'ZAG' | 'MEI' | 'ATA'; quem?: 't' | 'o' }
const KINGS: FraseKings[] = [
  { c: ['o goleiro do {t} sai da área e vira jogador de linha. Coisa de Kings', 'the {t} keeper leaves the box and plays outfield. Pure Kings'], p: ['{p}, goleiro do {t}, sai da área e vira jogador de linha. Coisa de Kings', '{p}, the {t} keeper, leaves the box and plays outfield. Pure Kings'], pos: 'GOL' },
  { c: ['o presidente do {t} levanta na tribuna e pede raça', 'the {t} president stands up in the box and demands fight'] },
  { c: ['a torcida grita o nome do presidente do {o}', 'the crowd chants the name of the {o} president'] },
  { c: ['campo pequeno: o {t} chega no ataque em dois toques', 'small pitch: {t} reach the attack in two touches'], p: ['campo pequeno: {p} recebe e o {t} já está no ataque', 'small pitch: {p} receives and {t} are already attacking'], pos: 'MEI' },
  { c: ['troca volante no {t}: entra um, sai outro, e o jogo nem para', 'rolling sub for {t}: one on, one off, and play never stops'], p: ['troca volante no {t}: {p} sai pra respirar e já volta daqui a pouco', 'rolling sub for {t}: {p} comes off for a breather and will be back soon'], pos: 'ATA' },
  { c: ['o banco do {t} já discute qual carta pode sair na vez deles', 'the {t} bench is already guessing which card they might draw'] },
  { c: ['o DJ da arena solta o som e a arquibancada pula', 'the arena DJ drops a beat and the stands are jumping'] },
  { c: ['o telão mostra a torcida do {t} fantasiada. Que festa', 'the big screen shows the {t} fans in costume. What a party'] },
  { c: ['as luzes da arena piscam na cor do {t}', 'the arena lights flash in {t} colours'] },
  { c: ['o streamer do {o} grita tanto que dá pra ouvir daqui', 'the {o} streamer is shouting so loud you can hear it from here'] },
  { c: ['parede de 7 do {o}: todo mundo atrás da linha da bola', '{o} park all 7 behind the ball'], p: ['{p} organiza a parede do {o}: todo mundo atrás da linha da bola', '{p} organises the {o} wall: everyone behind the ball'], pos: 'ZAG', quem: 'o' },
  { c: ['o {t} pressiona alto, em campo de futebol 7 não tem pra onde correr', '{t} press high, on a 7-a-side pitch there is nowhere to run'], p: ['{p} pressiona alto pelo {t}, em campo de futebol 7 não tem pra onde correr', '{p} presses high for {t}, on a 7-a-side pitch there is nowhere to run'], pos: 'ATA' },
  { c: ['tabelinha rápida do {t} contra a tabela, quase na parede da arena', 'a quick one-two by {t} right by the arena boards'], p: ['tabelinha de {p} com o companheiro, quase na parede da arena', '{p} plays a quick one-two right by the arena boards'], pos: 'MEI' },
  { c: ['o {o} rouba a bola e sai em contra-ataque de três contra dois', '{o} win it back and break three against two'], p: ['{p} rouba a bola e o {o} sai em três contra dois', '{p} wins it back and {o} break three against two'], pos: 'ZAG', quem: 'o' },
  { c: ['o juiz da Kings pede calma, ninguém quer cartão nessa hora', 'the Kings ref calls for calm, nobody wants a card now'] },
  { c: ['o {t} chama a torcida com os braços. A arena responde', '{t} wave the crowd on. The arena answers'], p: ['{p} chama a torcida do {t} com os braços. A arena responde', '{p} waves the {t} crowd on. The arena answers'], pos: 'ATA' },
  { c: ['lance de habilidade do {t} na lateral da arena, a câmera nem acompanha', 'a skill move by {t} by the arena wall, the camera can barely keep up'], p: ['{p} faz um lance de habilidade na lateral da arena, a câmera nem acompanha', '{p} pulls off a skill move by the arena wall, the camera can barely keep up'], pos: 'ATA' },
  { c: ['o goleiro do {o} repõe rápido com a mão, jogo de Kings é sem respiro', 'the {o} keeper throws it out quickly, Kings games never pause'], p: ['{p}, goleiro do {o}, repõe rápido com a mão: jogo de Kings é sem respiro', '{p}, the {o} keeper, throws it out quickly: Kings games never pause'], pos: 'GOL', quem: 'o' },
  { c: ['os comentaristas apostam na transmissão quem leva hoje', 'the commentators are betting on air who takes it today'] },
  { c: ['o {t} gira a bola de pé em pé, a arena faz olé', '{t} pass it around, the arena shouts olé'], p: ['{p} gira a bola do {t} de pé em pé, a arena faz olé', '{p} moves the {t} ball around, the arena shouts olé'], pos: 'MEI' },
]
export const ACERVO_KINGS_RADIO = KINGS.length

// 🕐 começo de jogo e fim de jogo têm cara própria (sem dizer placar)
const CEDO: Par[] = [
  ['o {t} começa estudando o {o}, sem pressa', '{t} start by sizing up {o}, no rush'],
  ['jogo começa com o {t} rodando a bola atrás', 'the game starts with {t} passing it around at the back'],
  ['o {o} começa ligado, marcando lá em cima', '{o} start switched on, pressing high'],
  ['primeiros minutos de muita disputa entre {t} e {o}', 'opening minutes full of battles between {t} and {o}'],
  ['o {t} tenta impor o ritmo logo de cara', '{t} try to set the tempo right from the start'],
]
const TARDE: Par[] = [
  ['reta final, e o {t} gasta o último fôlego', 'the home stretch, and {t} use their last breath'],
  ['o quarto árbitro já prepara a placa dos acréscimos', 'the fourth official is getting the stoppage-time board ready'],
  ['as pernas pesam, e o {t} joga no coração', 'the legs are heavy, and {t} play on heart'],
  ['o {o} pede a bola rápida, cada segundo conta', '{o} want the ball back quickly, every second counts'],
  ['fim de jogo chegando, a torcida do {t} fica de pé', 'full time approaching, the {t} fans are on their feet'],
]

/** 🎲 a rádio de UM jogo: minutos e frases, sem gol, sem chance, sem repetir lance */
/** `kings`: jogo da Kings League (15/10) — partida longa, então a rádio fala MAIS (até 18 frases) e mistura frases próprias
 *  da Kings (goleiro-linha, presidente na tribuna, campo de futebol 7, arena, DJ…) com as de sempre. */
export function radioDoJogo(seed: number, ocupados: number[], roundMs: number, kings = false): RadioLance[] {
  const n = frasesPorJogo(roundMs, kings ? 18 : 9)
  if (n === 0) return []
  const rng = mulberry((seed ^ 0x5AD10) >>> 0)
  const livre = (m: number, ja: number[]) => ocupados.every(o => Math.abs(o - m) >= 3) && ja.every(o => Math.abs(o - m) >= 5) && !(m >= 44 && m <= 46)
  const mins: number[] = []
  // espalha: um minuto por fatia do jogo, pra não amontoar
  for (let k = 0; k < n; k++) {
    const ini = 2 + Math.floor((k * 88) / n), fim = 2 + Math.floor(((k + 1) * 88) / n)
    for (let t = 0; t < 12; t++) { const m = ini + Math.floor(rng() * Math.max(1, fim - ini)); if (livre(m, mins)) { mins.push(m); break } }
  }
  mins.sort((a, b) => a - b)
  const usados = new Set<number>()
  return mins.map(min => {
    if (kings && rng() < 0.45) {
      let i = Math.floor(rng() * KINGS.length)
      for (let t = 0; t < KINGS.length && usados.has(3000 + i); t++) i = (i + 1) % KINGS.length
      usados.add(3000 + i)
      return { min, i: 3000 + i, a: Math.floor(rng() * ABRE.length), f: Math.floor(rng() * FECHA.length), home: rng() < 0.5 }
    }
    const lista = min <= 12 ? 'cedo' : min >= 82 ? 'tarde' : 'meio'
    const tam = lista === 'cedo' ? CEDO.length : lista === 'tarde' ? TARDE.length : LANCES.length
    let i = Math.floor(rng() * tam)
    for (let t = 0; t < tam && usados.has(i + (lista === 'cedo' ? 1000 : lista === 'tarde' ? 2000 : 0)); t++) i = (i + 1) % tam
    usados.add(i + (lista === 'cedo' ? 1000 : lista === 'tarde' ? 2000 : 0))
    const a = Math.floor(rng() * ABRE.length), f = Math.floor(rng() * FECHA.length)
    return { min, i: lista === 'cedo' ? 1000 + i : lista === 'tarde' ? 2000 + i : i, a, f, home: rng() < 0.5 }
  })
}

/** o texto da frase, no idioma pedido */
export function narraRadio(l: RadioLance, casa: string, fora: string, en: boolean, elencos?: { casa?: CartaRadio[]; fora?: CartaRadio[] }): string {
  const k = en ? 1 : 0
  if (l.i >= 3000) {
    // 👑 frase da Kings: com jogador quando dá (posição pedida), senão a versão do clube
    const kf = KINGS[(l.i - 3000) % KINGS.length]
    const t = l.home ? casa : fora, o = l.home ? fora : casa
    const doTime = kf.pos ? ((kf.quem ?? 't') === 't') === l.home ? elencos?.casa : elencos?.fora : undefined
    const jogador = kf.pos ? quemCitar(doTime, kf.pos, l) : null
    const cru = jogador && kf.p ? kf.p[k].replace(/\{p\}/g, jogador) : kf.c[k]
    const abre = ABRE[l.a][k]
    const corpo = cru.replace(/\{t\}/g, t).replace(/\{o\}/g, o)
    const txt = abre + (abre && !(abre.endsWith(', ') || abre.endsWith(': ')) ? corpo.charAt(0).toUpperCase() + corpo.slice(1) : corpo)
    return (/[.!?…]$/.test(txt) ? txt : txt + '.') + FECHA[l.f][k]
  }
  const par = l.i >= 2000 ? TARDE[l.i - 2000] : l.i >= 1000 ? CEDO[l.i - 1000] : LANCES[l.i]
  const t = l.home ? casa : fora, o = l.home ? fora : casa
  // 🧑 versão com o nome do jogador, quando a escalação está na mão (14/10)
  const nom = l.i < 1000 ? NOMEADO[par[0]] : undefined
  const doTime = nom ? ((nom[3] === 't') === l.home ? elencos?.casa : elencos?.fora) : undefined
  const jogador = nom ? quemCitar(doTime, nom[2], l) : null
  const cru = nom && jogador ? nom[k].replace(/\{p\}/g, jogador) : par[k]
  // o NOME do clube nunca muda de caixa (é identidade); só a 1ª letra de frase comum
  const comVar = cru.startsWith('{') || (!!jogador && !!nom && nom[k].startsWith('{p}'))
  const abre = ABRE[l.a][k]
  const minuscula = !!abre && (abre.endsWith(', ') || abre.endsWith(': '))
  const base = comVar || minuscula ? cru : cru.charAt(0).toUpperCase() + cru.slice(1)
  const corpo = base.replace(/\{t\}/g, t).replace(/\{o\}/g, o)
  const txt = abre + corpo
  return (/[.!?…]$/.test(txt) ? txt : txt + '.') + FECHA[l.f][k]
}

/** a frase que vale no minuto `min`: a última que já passou (null antes da primeira) */
export function radioNoMinuto(lances: RadioLance[], min: number): RadioLance | null {
  let r: RadioLance | null = null
  for (const l of lances) if (l.min <= min) r = l
  return r
}

/** pra trava: tamanhos dos bancos (PT e EN) e quantas frases diferentes dá pra montar */
export const ACERVO_RADIO = { abre: ABRE.length, fecha: FECHA.length, lances: LANCES.length, cedo: CEDO.length, tarde: TARDE.length }
export const BANCOS_RADIO: Record<string, Par[]> = { ABRE, FECHA, LANCES, CEDO, TARDE }
export const NOMEADOS_RADIO = NOMEADO
