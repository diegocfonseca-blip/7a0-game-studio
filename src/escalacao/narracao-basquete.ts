// ─── 🏀🎙️ NARRAÇÃO DO BASQUETE — o rádio embaixo do placar cinema (18/11) ─────────────
//
// Diego: *"a narração fica na parte de baixo do placar cinema, lembra?? Além disso precisa de variedades enormes de
// narrações com base em basquete"*. O futebol tem a Rádio Legends (`radio.ts`); o basquete não tinha nada ali.
//
// Regras da casa:
//  · 🌐 PT e EN SEMPRE juntos, no mesmo par (quem adicionar frase, adiciona as duas línguas).
//  · 🙈 Nada de spoiler: só narra cesta que JÁ apareceu no placar (minuto <= o do relógio) e o resultado só no apito.
//  · 🎲 Sem estado e sem `Math.random`: a mesma semente + o mesmo minuto dão a mesma frase em todo aparelho da sala.
//  · 🧍 Nome de jogador e de time NUNCA se traduz. Tapa-buraco (fake) não ganha frase com nome (quem chama não manda ele).
//  · Humor BR com moderação: é rádio de jogo, não piada atrás de piada.
//
// Placeholders: {j} jogador · {t} time dele · {o} o outro time · {q} quarto · {d} diferença · {p} placar · {a} quem lidera

export type FalaBB = { min: string; txt: string; tipo?: 'gol' | 'lance' | 'jogo'; tag?: string }
type Par = readonly [string, string]

// 🏀 ABERTURA (bola ao alto)
const ABERTURA: Par[] = [
  ['Bola ao alto! Começa {t} × {o}!', 'Tip-off! {t} vs {o} is underway!'],
  ['Subiu a bola no círculo central — tá valendo!', 'The ball goes up at center court — we are live!'],
  ['Luzes acesas, torcida de pé: {t} e {o} começam a brigar!', 'Lights on, crowd up: {t} and {o} get going!'],
  ['Primeira posse do jogo. Calma que é maratona, não é tiro curto.', 'First possession. Easy now — it is a marathon, not a sprint.'],
  ['Começou! Quem acerta o primeiro arremesso dita o ritmo.', 'Here we go! First bucket sets the tone.'],
  ['Saltou o pivô, a bola é tapeada pra trás… jogo rolando!', 'The big man jumps, the ball is tapped back… game on!'],
  ['Apito do árbitro e lá vamos nós, 48 minutos de pura emoção!', 'Whistle blows — 48 minutes of pure drama ahead!'],
  ['Ginásio lotado, tênis cantando na madeira: começou!', 'Packed arena, sneakers squeaking: it has started!'],
  ['{t} ganha a bola ao alto e já sai jogando.', '{t} win the tip and push right away.'],
  ['Bola em jogo! O técnico de {o} já tá gritando lá do banco.', 'Ball is live! {o}\'s coach is already shouting from the bench.'],
  ['Começa o duelo. Hoje alguém sai daqui com o nome no jornal.', 'The duel begins. Someone leaves here with their name in the paper.'],
  ['Primeiro quarto! Ninguém ganha jogo agora, mas dá pra perder.', 'First quarter! You can\'t win it now, but you can lose it.'],
]
// 🏀 CESTA DE 2 (bandeja, meia-distância, gancho, etc.)
const DOIS: Par[] = [
  ['{j} entra na bandeja e deixa lá dentro! Dois pra {t}.', '{j} drives for the layup and lays it in! Two for {t}.'],
  ['Arremesso de meia distância de {j}… caiu!', '{j} pulls up from mid-range… good!'],
  ['{j} gira no garrafão, gancho de esquerda — cesta!', '{j} spins in the paint, left-handed hook — good!'],
  ['Corta pro meio, {j} para, sobe e acerta o jumper.', 'Cuts to the middle, {j} stops, rises and hits the jumper.'],
  ['Fadeaway de {j}! Caindo pra trás e ainda assim acertou.', '{j} with the fadeaway! Falling back and still nails it.'],
  ['{j} recebe de costas, gira e finaliza com toque de seda.', '{j} catches with his back to the basket, turns and finishes softly.'],
  ['Floater de {j} por cima do pivô! Que toque!', '{j} floats it over the big man! What a touch!'],
  ['Contra-ataque rápido e {j} completa sozinho.', 'Quick break and {j} finishes alone.'],
  ['Pick and roll perfeito, {j} recebe livre e marca.', 'Perfect pick and roll, {j} rolls free and scores.'],
  ['{j} tabela no vidro — e a bola beija a tabela e cai!', '{j} banks it — off the glass and in!'],
  ['Corta pela linha de fundo, {j} faz a bandeja reversa. Lindo!', 'Baseline cut, {j} with the reverse layup. Beautiful!'],
  ['{j} pega o rebote ofensivo e já devolve pra cesta.', '{j} grabs the offensive board and puts it right back.'],
  ['Step-back de {j} da cabeça do garrafão. Dois pontos!', '{j} step-back from the elbow. Two points!'],
  ['{j} passa pelo marcador como se ele fosse cone de treino.', '{j} goes past his man like a training cone.'],
  ['Euro step de {j}! Dois passos, duas direções, uma cesta.', 'Euro step from {j}! Two steps, two directions, one bucket.'],
  ['{j} finaliza no contato e a bola ainda cai. Força!', '{j} finishes through contact and it still drops. Strength!'],
  ['Gancho de {j} lá do garrafão, à moda antiga.', '{j} with an old-school hook in the paint.'],
  ['{j} acha o espaço na zona morta e converte.', '{j} finds space in the short corner and converts.'],
  ['Isolação pra {j}… ele cria e acerta. Fominha que resolve!', 'Isolation for {j}… he creates and hits. Ball hog who delivers!'],
  ['{j} recebe no poste alto, ameaça o passe e arremessa. Cesta!', '{j} at the high post, fakes the pass and shoots. Good!'],
  ['Spin move de {j} e bandeja na cara do marcador!', '{j} spin move and a layup right in his defender\'s face!'],
  ['{j} pega o rebote, atravessa a quadra sozinho e faz.', '{j} grabs the board, goes coast to coast and scores.'],
  ['Arremesso de {j} quica no aro duas vezes… e entra!', '{j}\'s shot rattles around twice… and in!'],
  ['{j} acerta da linha do lance livre, mas com a bola rolando.', '{j} hits from the free-throw line — with the ball live.'],
  ['Corta, recebe, finaliza: {j} no automático hoje.', 'Cut, catch, finish: {j} on autopilot tonight.'],
  ['{j} levanta a bola por cima de dois marcadores. Cesta de malandro!', '{j} lifts it over two defenders. Crafty bucket!'],
  ['Dois pontos de {j} com a mão fraca. Treinou nas férias.', 'Two from {j} with his off hand. Practiced in the summer.'],
  ['Jogada ensaiada de {t} e {j} sai livre na bandeja.', '{t} run their set play and {j} gets the free layup.'],
]
// 🏀 CESTA DE 3
const TRES: Par[] = [
  ['TRÊS PONTOS! {j} solta da linha e só balançou a rede!', 'THREE! {j} lets it fly and it is nothing but net!'],
  ['{j} da zona morta… CAIU! Bola de três pra {t}.', '{j} from the corner… GOOD! Three for {t}.'],
  ['Bomba de {j} lá de longe! Nem olhou pro aro direito.', 'Bomb from {j} way downtown! Barely looked at the rim.'],
  ['Step-back de três de {j}! Marcador ficou plantado.', '{j} step-back three! His man is planted.'],
  ['{j} recebe livre na linha de três e não perdoa.', '{j} catches it wide open from three and does not miss.'],
  ['Tiro do logo! {j} arremessou do meio da quadra quase!', 'From the logo! {j} shot it nearly from half court!'],
  ['Três de {j} com a mão na cara. Isso é confiança!', '{j} hits a three with a hand in his face. That is confidence!'],
  ['{j} arma, mira e… splash! Mais três.', '{j} sets, aims and… splash! Three more.'],
  ['Passe extra, bola rodou, {j} livre: três pontos!', 'Extra pass, ball moved, {j} open: three points!'],
  ['{j} sai do corta-luz e acerta a de três correndo.', '{j} comes off the screen and drills the three on the move.'],
  ['TRIPLA! {j} esquentou a mão e não quer saber de esfriar.', 'TRIPLE! {j} has caught fire and will not cool down.'],
  ['Da cabeça do garrafão, {j} manda de três. Caixa!', 'From the top of the key, {j} lets it go. Cash!'],
  ['{j} ameaça entrar, recua e manda de três. Malandragem!', '{j} fakes the drive, steps back and hits the three. Crafty!'],
  ['Três pontos de {j}! O banco de {t} levantou inteiro.', 'Three from {j}! The {t} bench is on its feet.'],
  ['Contra-ataque, {j} para na linha e chuta de três. Cesta!', 'On the break, {j} stops at the line and fires. Good!'],
  ['{j} de três! A defesa de {o} deixou espaço demais.', '{j} from three! {o}\'s defense gave him too much room.'],
  ['Bola de três de {j} que bateu no aro, subiu… e caiu!', '{j}\'s three hits the rim, bounces up… and drops!'],
  ['Mão quente: {j} acerta mais uma de longe.', 'Hot hand: {j} hits another from deep.'],
  ['{j} pega o rebote longo e manda de três na hora. Sem pensar!', '{j} grabs the long rebound and fires right away. No hesitation!'],
  ['Bola de três de {j} na frente do banco de {o}. Provocação!', '{j} buries a three right in front of the {o} bench. Cheeky!'],
  ['Três de {j}! Esse arremesso tinha GPS.', 'Three from {j}! That shot had GPS.'],
  ['{j} solta de três a dois metros da linha. Coragem ou loucura? Caiu!', '{j} shoots two meters behind the line. Brave or crazy? Good!'],
  ['Kick-out pra {j} na ala e mais três pontos no placar.', 'Kick-out to {j} on the wing and three more on the board.'],
  ['{j} acertou de três com o relógio de posse zerando!', '{j} hits a three as the shot clock expires!'],
]
// 🏀 ENTERRADA
const ENTERRADA: Par[] = [
  ['ENTERRADA DE {j}! O aro tá balançando até agora!', 'SLAM by {j}! The rim is still shaking!'],
  ['{j} voou! Enterrada com as duas mãos!', '{j} took flight! Two-handed dunk!'],
  ['Ponte aérea! {j} pega lá em cima e crava!', 'Alley-oop! {j} catches it up high and throws it down!'],
  ['{j} passou pelo pivô e enterrou na cara dele. Pôster!', '{j} beat the big man and dunked on him. Poster!'],
  ['Enterrada de moinho de {j}! Isso é show!', 'Windmill dunk by {j}! That is a show!'],
  ['{j} pendurou no aro! O ginásio veio abaixo.', '{j} hangs on the rim! The arena erupts.'],
  ['Contra-ataque e {j} enterra sozinho. Fácil demais.', 'Fast break and {j} dunks it alone. Too easy.'],
  ['{j} pegou o rebote ofensivo e enterrou na volta. Putback!', '{j} grabs the offensive board and dunks it back. Putback!'],
  ['Tomahawk de {j}! Uma mão só, lá do alto!', 'Tomahawk by {j}! One hand, from way up!'],
  ['{j} enterra de reverse! Virou de costas pro aro e cravou.', '{j} with the reverse slam! Back to the rim and hammered it.'],
  ['Que enterrada de {j}! Os marcadores só assistiram.', 'What a dunk by {j}! The defenders just watched.'],
  ['{j} decolou da linha do lance livre — quase! — e enterrou.', '{j} took off near the free-throw line — almost! — and slammed it.'],
  ['Corta pro meio, recebe e {j} crava com força. Aviso dado!', 'Cuts to the middle, catches, and {j} slams it hard. Message sent!'],
  ['{j} enterrou e ainda olhou pra torcida de {o}. Provocou!', '{j} dunks it and stares at the {o} crowd. Taunting!'],
  ['Enterrada de {j} que faz o técnico de {o} pedir tempo na cabeça.', '{j}\'s dunk makes the {o} coach mentally call a timeout.'],
  ['{j} pegou a ponte aérea com uma mão só. Absurdo!', '{j} caught the lob with one hand. Ridiculous!'],
  ['Aro tremendo, torcida pulando: {j} enterrou!', 'Rim shaking, crowd jumping: {j} dunked it!'],
  ['{j} enterra por cima de quem tentou o toco. Coitado.', '{j} dunks over the guy who tried to block it. Poor guy.'],
]
// 🧱 TOCO
const TOCO: Par[] = [
  ['TOCO DE {j}! Mandou a bola lá pra arquibancada!', 'BLOCKED by {j}! Sent it into the stands!'],
  ['{j} subiu junto e deu um toco limpinho.', '{j} rose with him and blocked it clean.'],
  ['Não passa ninguém pelo garrafão de {t}: toco de {j}!', 'No one gets through {t}\'s paint: {j} with the block!'],
  ['{j} apagou o arremesso! Isso foi um "aqui não".', '{j} erased the shot! That was a "not in here".'],
  ['Toco por trás de {j} no contra-ataque. Que recuperação!', '{j} with the chase-down block on the break. What a recovery!'],
  ['{j} prendeu a bola na tabela. Toco de respeito!', '{j} pinned it on the glass. Respectable block!'],
  ['Arremesso de {o} e… toco de {j}! Sem chance.', '{o} shoots and… blocked by {j}! No chance.'],
  ['{j} é um muro hoje. Mais um toco!', '{j} is a wall tonight. Another block!'],
  ['Toco de {j} e a bola sai pro contra-ataque de {t}.', '{j} blocks it and {t} are off on the break.'],
  ['O atacante de {o} subiu confiante e desceu com vergonha: toco de {j}.', '{o}\'s shooter went up confident and came down embarrassed: {j} block.'],
  ['{j} deu um tapa na bola que ela ainda tá voando.', '{j} swatted it so hard it is still flying.'],
  ['Toco de {j}! Na NBA isso aparece nos melhores da noite.', 'Block by {j}! That makes tonight\'s highlight reel.'],
  ['{j} adivinhou o arremesso e chegou antes. Toco!', '{j} read the shot and got there first. Block!'],
  ['Defesa de {t} fecha tudo: toco de {j} no garrafão.', '{t}\'s defense shuts it down: {j} block in the paint.'],
  ['{j} mandou o arremesso de volta pra casa. Volta outro dia!', '{j} sent that shot back home. Try another day!'],
]
// 🧤 ROUBO / CONTRA-ATAQUE
const ROUBO: Par[] = [
  ['Roubo de bola de {j}! Saiu em disparada.', 'Steal by {j}! He is off and running.'],
  ['{j} leu o passe e interceptou. Ladrão bom!', '{j} read the pass and picked it off. Smooth thief!'],
  ['Mão leve de {j}: tirou a bola do drible de {o}.', 'Quick hands from {j}: took it right off {o}\'s dribble.'],
  ['{j} cortou a linha do passe. Agora é contra-ataque de {t}!', '{j} jumps the passing lane. Now {t} are on the break!'],
  ['Pressão na quadra toda e {j} rouba a bola.', 'Full-court pressure and {j} gets the steal.'],
  ['{j} cutucou a bola por trás. O armador de {o} nem viu.', '{j} poked it from behind. {o}\'s guard never saw it.'],
  ['Erro de {o} e {j} agradece. Bola de {t}.', 'Turnover by {o} and {j} says thanks. {t} ball.'],
  ['{j} antecipou o passe como se tivesse lido o pensamento.', '{j} anticipated the pass like he read his mind.'],
  ['Roubo de {j} no meio da quadra! A torcida de {t} explode.', '{j} steals it at midcourt! The {t} crowd explodes.'],
  ['{j} armou a armadilha e {o} caiu direitinho.', '{j} set the trap and {o} fell right into it.'],
  ['Passe preguiçoso de {o}, roubo de {j}. Não pode dar mole!', 'Lazy pass by {o}, steal by {j}. Can\'t be careless!'],
  ['{j} roubou e ainda deu tchauzinho. Abusado!', '{j} stole it and waved goodbye. Cheeky!'],
  ['Defesa agressiva de {t}: {j} desarma e sai jogando.', 'Aggressive {t} defense: {j} strips it and goes.'],
  ['{j} pegou a bola no ar. Interceptação na hora certa!', '{j} snatched it out of the air. Perfect timing!'],
]
// 🧲 REBOTE
const REBOTE: Par[] = [
  ['Rebote de {j}! Brigou lá em cima com dois.', 'Rebound {j}! Fought two guys for it up top.'],
  ['{j} domina o garrafão: mais um rebote.', '{j} owns the paint: another rebound.'],
  ['Arremesso errado e o rebote fica com {j}.', 'Missed shot and {j} cleans the glass.'],
  ['Rebote ofensivo de {j}! Segunda chance pra {t}.', 'Offensive board by {j}! Second chance for {t}.'],
  ['{j} se posicionou melhor e pegou o rebote. Fundamento!', '{j} boxed out and grabbed it. Fundamentals!'],
  ['Ninguém pega rebote como {j} hoje.', 'Nobody rebounds like {j} tonight.'],
  ['{j} arrancou a bola da mão do rival. Rebote na marra!', '{j} ripped it out of his man\'s hands. Tough rebound!'],
  ['Bola sobe, todo mundo pula, {j} fica com ela.', 'The ball goes up, everyone jumps, {j} comes down with it.'],
  ['Rebote defensivo de {j} e saída rápida de {t}.', 'Defensive board by {j} and {t} push quickly.'],
  ['{j} tapinha a bola pra manter a posse. Esperto!', '{j} tips it to keep possession. Smart!'],
  ['{j} pegou o rebote com uma mão. Que mãozona!', '{j} grabbed the rebound one-handed. Huge mitts!'],
  ['Garrafão de {t} é de {j}: rebote atrás de rebote.', '{t}\'s paint belongs to {j}: rebound after rebound.'],
]
// 🅰️ PASSE / ASSISTÊNCIA (o lance antes da cesta)
const PASSE: Par[] = [
  ['Passe de {j} sem olhar! Que visão de jogo.', 'No-look pass from {j}! What vision.'],
  ['{j} acha o companheiro entre três marcadores. Que passe!', '{j} finds a teammate between three defenders. What a pass!'],
  ['Assistência de {j} pelas costas. Isso é showtime!', 'Behind-the-back assist from {j}. That is Showtime!'],
  ['{j} cadencia o jogo, chama a jogada e distribui.', '{j} slows it down, calls the play and distributes.'],
  ['Passe quicado de {j} no meio do garrafão. Perfeito!', '{j} with a bounce pass right through the paint. Perfect!'],
  ['{j} levanta a ponte aérea na medida.', '{j} throws the lob right on the money.'],
  ['Bola rodou de mão em mão e {j} deu o último passe.', 'The ball moved hand to hand and {j} made the final pass.'],
  ['{j} atrai dois marcadores e solta pro livre. Altruísta!', '{j} draws two defenders and kicks it to the open man. Unselfish!'],
  ['Armação de {j}: {t} joga por música hoje.', '{j} running the show: {t} are in rhythm tonight.'],
  ['{j} lança da defesa pro ataque. Passe de quarterback!', '{j} launches it full court. A quarterback pass!'],
  ['{j} dá o passe e já comemora. Sabia que ia cair.', '{j} makes the pass and is already celebrating. Knew it was going in.'],
]
// 🎯 LANCE LIVRE
const LIVRE: Par[] = [
  ['Falta em {j}. Vai pra linha do lance livre.', 'Foul on {j}. He heads to the line.'],
  ['{j} na linha, respira fundo… converte os dois.', '{j} at the line, deep breath… makes both.'],
  ['Lance livre de {j}: o primeiro entra, o segundo bate e cai.', '{j} at the line: first one good, second rattles in.'],
  ['{j} sofre a falta e ainda faz a cesta! E mais um!', '{j} takes the foul and still scores! And one!'],
  ['Falta dura em {j}. Torcida de {t} pede técnica.', 'Hard foul on {j}. {t} fans want a technical.'],
  ['{j} acerta os lances livres. Frieza de cirurgião.', '{j} sinks the free throws. Ice cold.'],
  ['{j} erra o primeiro lance livre e a torcida de {o} comemora.', '{j} misses the first free throw and the {o} crowd cheers.'],
  ['Na linha, {j} faz o ritual: três quiques, respira e… cesta.', 'At the line, {j} does his routine: three bounces, breath and… good.'],
  ['{o} faz falta tática em {j}. Vai pra linha.', '{o} with the intentional foul on {j}. To the line he goes.'],
]
// ⏸️ TEMPO / CLIMA DE JOGO
const CLIMA: Par[] = [
  ['Pedido de tempo! O técnico de {o} desenha a jogada na prancheta.', 'Timeout called! The {o} coach draws it up on the whiteboard.'],
  ['Jogo pegado no {q}º quarto. Ninguém dá um passo de graça.', 'Physical game in the {q}th quarter. Nobody gives an inch.'],
  ['A defesa de {t} tá apertando: 24 segundos parecem 5.', '{t}\'s defense is tight: 24 seconds feel like 5.'],
  ['Substituição em {t}: entra sangue novo na quadra.', 'Substitution for {t}: fresh legs on the floor.'],
  ['Bola presa! Disputa no salto entre {t} e {o}.', 'Jump ball! Held between {t} and {o}.'],
  ['Violação de 24 segundos para {o}. A defesa venceu essa.', 'Shot-clock violation on {o}. Defense wins that one.'],
  ['Andou com a bola! Bola de {t}.', 'Traveling! {t} ball.'],
  ['Mascote de {t} chacoalhando a torcida no tempo técnico.', '{t}\'s mascot gets the crowd going during the timeout.'],
  ['O telão mostra a torcida de {o} roendo as unhas.', 'The jumbotron shows {o} fans biting their nails.'],
  ['Desafio do técnico! A arbitragem vai revisar o lance.', 'Coach\'s challenge! The refs go to the monitor.'],
  ['Corta-luz ilegal de {o}. A posse muda de lado.', 'Illegal screen on {o}. Possession changes.'],
  ['Defesa por zona de {t}! O ataque de {o} rodou a bola sem achar espaço.', '{t} go zone! {o} swing it around and find nothing.'],
  ['{t} subiu a marcação na quadra toda. Pressão total!', '{t} press full court. Total pressure!'],
  ['Ritmo alto: as duas equipes trocando cestas no {q}º quarto.', 'Fast pace: both teams trading buckets in the {q}th.'],
]
// 📊 SITUAÇÃO DO PLACAR
const DISPARADA: Par[] = [
  ['{a} abre {d} pontos e o técnico adversário coça a cabeça.', '{a} lead by {d} and the other coach scratches his head.'],
  ['Corrida de {a}! A vantagem já é de {d}.', '{a} on a run! The lead is now {d}.'],
  ['{a} tá passeando: {d} pontos na frente.', '{a} are cruising: {d} points up.'],
  ['Diferença de {d} pra {a}. Vai precisar de milagre do outro lado.', '{d}-point lead for {a}. The other side needs a miracle.'],
  ['{a} dispara: {p}. A torcida já pede o banco.', '{a} pull away: {p}. The crowd wants the bench in.'],
  ['Massacre em andamento: {a} com {d} de vantagem.', 'Blowout in progress: {a} up by {d}.'],
  ['{a} administra a vantagem de {d}. Basquete de gente grande.', '{a} manage a {d}-point lead. Grown-up basketball.'],
  ['Placar elástico: {p}. {a} sobrando.', 'Lopsided: {p}. {a} way out in front.'],
]
const APERTADO: Par[] = [
  ['Jogo pau a pau: {p}!', 'Neck and neck: {p}!'],
  ['Ninguém desgarra! {p} e a arena tá fervendo.', 'Nobody can pull away! {p} and the arena is boiling.'],
  ['Troca de liderança! O jogo virou de novo.', 'Lead change! It has flipped again.'],
  ['Diferença mínima: {p}. Cada posse vale ouro.', 'Tiny margin: {p}. Every possession is gold.'],
  ['Empate técnico na quadra: {p}.', 'Dead even on the court: {p}.'],
  ['Clássico de playoff fora de época: {p}!', 'Playoff feel out of season: {p}!'],
  ['Coração na boca: {p} e ninguém quer piscar.', 'Hearts in mouths: {p} and nobody wants to blink.'],
  ['Cesta pra cá, cesta pra lá: {p}.', 'Bucket here, bucket there: {p}.'],
]
// ⏱️ FIM DE QUARTO / INTERVALO / ÚLTIMO QUARTO
const FIM_Q: Par[] = [
  ['Fim do {q}º quarto: {p}.', 'End of the {q}th quarter: {p}.'],
  ['Buzina! Acabou o {q}º quarto com {p}.', 'Buzzer! The {q}th quarter ends at {p}.'],
  ['Cesta no estouro do cronômetro? Não deu! Fim do {q}º quarto: {p}.', 'Buzzer-beater? Not this time! End of the {q}th: {p}.'],
  ['Pausa curta. Depois de {q} quartos: {p}.', 'Short break. After {q} quarters: {p}.'],
]
const INTERVALO: Par[] = [
  ['INTERVALO! Vai todo mundo pro vestiário com {p}.', 'HALFTIME! Everyone heads to the locker room at {p}.'],
  ['Metade do jogo: {p}. O técnico de {o} vai ter que conversar sério.', 'Halfway: {p}. The {o} coach has some talking to do.'],
  ['Show do intervalo no ginásio. No placar: {p}.', 'Halftime show in the arena. On the board: {p}.'],
  ['Fim do primeiro tempo. {p} e muita bola ainda.', 'End of the first half. {p} and plenty left to play.'],
]
const ULTIMO_Q: Par[] = [
  ['Último quarto! Aqui se separa os homens dos meninos.', 'Fourth quarter! This is where legends are made.'],
  ['Reta final: 12 minutos pra decidir tudo.', 'Home stretch: 12 minutes to decide it all.'],
  ['Quarto quarto, braço pesado, cabeça fria. Quem aguenta?', 'Fourth quarter, heavy legs, cool heads. Who holds on?'],
  ['Começa o último quarto. Hora dos craques aparecerem.', 'The final quarter begins. Time for the stars to show up.'],
]
// 🏁 FINAL
const FINAL: Par[] = [
  ['FIM DE JOGO! {a} vence por {p}.', 'FINAL! {a} win it {p}.'],
  ['Buzina final! Vitória de {a}: {p}.', 'Final buzzer! {a} take it: {p}.'],
  ['Acabou! {a} leva a melhor, {p}.', 'It is over! {a} come out on top, {p}.'],
  ['Apagam as luzes do jogo: {a} venceu, {p}.', 'That is the game: {a} win, {p}.'],
  ['Vitória de {a}! {p} no placar final.', 'Victory for {a}! {p} the final score.'],
  ['{a} fecha a noite com vitória: {p}. Torcida canta no ginásio.', '{a} close the night with a win: {p}. The arena sings.'],
]

const QUARTOS_FIM = [23, 46, 70] // no relógio de 0–93: fim do 1º, intervalo, fim do 3º
const sorteia = (seed: number, salt: number) => { let x = (seed ^ Math.imul(salt + 1, 0x9E3779B1)) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x2C1B3C6D) >>> 0; x ^= x >>> 12; return x >>> 0 }
const pick = <T,>(arr: readonly T[], seed: number, salt: number): T => arr[sorteia(seed, salt) % arr.length]
const quarto = (min: number) => (min < 23 ? 1 : min < 46 ? 2 : min < 70 ? 3 : 4)
const ordQ = (q: number, en: boolean) => (en ? `${q}${q === 1 ? 'st' : q === 2 ? 'nd' : q === 3 ? 'rd' : 'th'}` : `${q}º`)
function preenche(par: Par, en: boolean, v: Record<string, string | number>): string {
  let s = en ? par[1] : par[0]
  // "{q}º quarto" / "{q}th quarter": o ordinal certo em cada língua
  if (v.q != null) s = s.replace(/\{q\}º/g, ordQ(Number(v.q), false)).replace(/\{q\}th/g, ordQ(Number(v.q), true))
  return s.replace(/\{(\w)\}/g, (_, k: string) => String(v[k] ?? ''))
}

export type EntradaNarracaoBB = {
  seed: number
  /** relógio do placar (0–93) */
  min: number
  fechado: boolean
  casa: string
  fora: string
  /** placar que JÁ está na tela */
  pc: number
  pf: number
  /** placar FINAL do jogo (só pra calcular o placar do começo de cada posse; nunca aparece antes do apito) */
  pcFim?: number
  pfFim?: number
  /** quantos minutos do relógio (0–93) cada fala fica na tela — o jogo rápido passa em segundos, a fala precisa durar ~2,6 s */
  minPorFala?: number
  /** cestas já mostradas (nome + minuto + lado) */
  cestas: { name: string; min: number; home: boolean }[]
  /** elencos de verdade (sem tapa-buraco), pra narrar defesa/rebote/passe com nome */
  elencoCasa?: { name: string; pos: string }[]
  elencoFora?: { name: string; pos: string }[]
  en: boolean
}
const POS_TOCO = ['ATA', 'MEI', 'ZAG'], POS_ROUBO = ['GOL', 'LAT', 'ZAG'], POS_REB = ['ATA', 'MEI', 'ZAG'], POS_PASSE = ['GOL', 'LAT']

/** 🎙️ a fala do rádio AGORA. Troca a cada ~3 minutos do relógio (uma posse narrada), sempre presa na semente. */
export function falaBasquete(e: EntradaNarracaoBB): FalaBB {
  const { seed, min, en } = e
  // ⏱️ 18/11 (Diego: *"tá apagada a narração"*): a fala fica PARADA durante a posse inteira (~3 minutos do relógio). Antes ela
  // usava o placar parcial, que muda a cada tique — a frase trocava o tempo todo e a animação de entrada nunca terminava (texto
  // apagadinho). Agora tudo sai do COMEÇO da posse: o placar daquele instante e a cesta mais recente até ali.
  const passo = Math.max(3, Math.round(e.minPorFala ?? 3)) // ⏱️ minutos do relógio por fala (quem chama converte ~2,6 s de tela)
  const slot = Math.floor(min / passo), m0 = slot * passo
  const naHora = (fim: number | undefined, agora: number) => (fim != null ? Math.round(fim * Math.min(1, m0 / 93)) : agora)
  const pc = e.fechado ? e.pc : naHora(e.pcFim, e.pc), pf = e.fechado ? e.pf : naHora(e.pfFim, e.pf)
  const placar = `${pc} × ${pf}`
  const lider = pc > pf ? e.casa : e.fora
  const dif = Math.abs(pc - pf)
  const base = { p: placar, a: lider, d: dif }
  if (e.fechado) return { min: '', tipo: 'jogo', txt: preenche(pick(FINAL, seed, 999), en, base) }
  const q = quarto(min)
  const relogio = '' // o relógio do quarto já está no placar (e a faixa põe ′ depois do minuto — "Q2′" ficava torto)
  // marcos do jogo: abertura, fim de quarto, intervalo e último quarto (janela de ~2 minutos depois da buzina)
  if (m0 === 0) { const casaComeca = sorteia(seed, 1) % 2 === 0; return { min: '', tipo: 'jogo', txt: preenche(pick(ABERTURA, seed, 2), en, { t: casaComeca ? e.casa : e.fora, o: casaComeca ? e.fora : e.casa }) } }
  for (const fq of QUARTOS_FIM) {
    if (passo <= 8 && m0 <= fq && fq < m0 + passo) { // jogo rápido demais (poucas falas): as falas vão pras cestas, não pros quartos
      const qq = fq === 23 ? 1 : fq === 46 ? 2 : 3
      if (qq === 2) return { min: relogio, tipo: 'jogo', txt: preenche(pick(INTERVALO, seed, 46), en, { ...base, o: e.pc >= e.pf ? e.fora : e.casa }) }
      if (qq === 3) return { min: relogio, tipo: 'jogo', txt: `${preenche(pick(FIM_Q, seed, 70), en, { ...base, q: 3 })} ${preenche(pick(ULTIMO_Q, seed, 71), en, base)}` }
      return { min: relogio, tipo: 'jogo', txt: preenche(pick(FIM_Q, seed, fq), en, { ...base, q: qq }) }
    }
  }
  // a cesta MAIS RECENTE já mostrada nos últimos 2 minutos ganha a fala (com o tipo de cesta sorteado)
  const recente = [...e.cestas].filter(c => c.min <= m0 && m0 - c.min < passo).sort((a, b) => b.min - a.min)[0]
  if (recente) {
    const t = recente.home ? e.casa : e.fora, o = recente.home ? e.fora : e.casa
    const salt = Math.floor(recente.min) * 31 + recente.name.length
    const r = sorteia(seed, salt) % 100
    const banco = r < 14 ? ENTERRADA : r < 44 ? TRES : DOIS
    return { min: relogio, tipo: 'gol', txt: preenche(pick(banco, seed, salt + 7), en, { j: recente.name, t, o }) }
  }
  // entre as cestas: defesa, rebote, passe, lance livre, clima e a situação do placar
  const r = sorteia(seed, slot * 13 + 5) % 100
  const ladoCasa = sorteia(seed, slot * 17 + 3) % 2 === 0
  const t = ladoCasa ? e.casa : e.fora, o = ladoCasa ? e.fora : e.casa
  const elenco = (ladoCasa ? e.elencoCasa : e.elencoFora) ?? []
  const jogadorDe = (pos: string[]) => {
    const op = elenco.filter(c => pos.includes(c.pos))
    const lista = op.length ? op : elenco
    return lista.length ? lista[sorteia(seed, slot * 7 + 11) % lista.length].name : ''
  }
  const comNome = (banco: Par[], pos: string[]) => { const j = jogadorDe(pos); return j ? preenche(pick(banco, seed, slot * 19 + 1), en, { j, t, o, q }) : null }
  let txt: string | null = null
  if (r < 14 && dif >= 12) txt = preenche(pick(DISPARADA, seed, slot * 23), en, base)
  else if (r < 14 && dif <= 4) txt = preenche(pick(APERTADO, seed, slot * 23), en, base)
  else if (r < 28) txt = comNome(TOCO, POS_TOCO)
  else if (r < 44) txt = comNome(ROUBO, POS_ROUBO)
  else if (r < 62) txt = comNome(REBOTE, POS_REB)
  else if (r < 76) txt = comNome(PASSE, POS_PASSE)
  else if (r < 86) txt = comNome(LIVRE, ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'])
  txt ??= preenche(pick(CLIMA, seed, slot * 29), en, { t, o, q })
  return { min: relogio, tipo: 'lance', txt }
}

/** 📏 quantas frases existem (pra trava `npm run narracao-bb`) */
export const BANCO_NARRACAO_BB = { ABERTURA, DOIS, TRES, ENTERRADA, TOCO, ROUBO, REBOTE, PASSE, LIVRE, CLIMA, DISPARADA, APERTADO, FIM_Q, INTERVALO, ULTIMO_Q, FINAL }

// 📺🏀 QUADRA 2D (18/11): a rádio narra a JOGADA QUE A QUADRA ESTÁ MOSTRANDO (o roteiro de `quadra2d-plano.ts`), não um
// lance sorteado à parte — se o Jordan acertou de 3 do canto, a fala é de 3; se foi toco do Ewing, a fala é do toco do Ewing.
// A bola de 3 só fala de "zona morta/canto" quando o arremesso saiu MESMO do canto.
export type LanceNarrado = { tipo: 'tres' | 'enterrada' | 'bandeja' | 'meia' | 'gancho' | 'lance' | 'erro' | 'toco' | 'roubo'; pts: number; t0: number; y: number }
export function falaDoLance(l: LanceNarrado, quem: string, defensor: string, time: string, outro: string, seed: number, en: boolean): FalaBB {
  const salt = Math.floor(l.t0 * 100) + quem.length * 7
  const canto = l.y <= 3 || l.y >= 47
  const semCanto = (b: readonly Par[]) => (canto ? b : b.filter(([pt]) => !/zona morta/i.test(pt)))
  const v = { j: quem, t: time, o: outro }
  switch (l.tipo) {
    case 'tres': return { min: '', tipo: 'gol', txt: preenche(pick(semCanto(TRES), seed, salt), en, v) }
    case 'enterrada': return { min: '', tipo: 'gol', txt: preenche(pick(ENTERRADA, seed, salt), en, v) }
    case 'bandeja': case 'meia': case 'gancho': return { min: '', tipo: 'gol', txt: preenche(pick(DOIS, seed, salt), en, v) }
    case 'lance': return { min: '', tipo: 'gol', txt: preenche(pick(LIVRE, seed, salt), en, v) }
    case 'toco': return { min: '', tipo: 'lance', txt: preenche(pick(TOCO, seed, salt), en, { ...v, j: defensor || quem, t: outro, o: time }) }
    case 'roubo': return { min: '', tipo: 'lance', txt: preenche(pick(ROUBO, seed, salt), en, { ...v, j: defensor || quem, t: outro, o: time }) }
    default: return { min: '', tipo: 'lance', txt: preenche(pick(REBOTE, seed, salt), en, { ...v, j: defensor || quem, t: outro, o: time }) }
  }
}
