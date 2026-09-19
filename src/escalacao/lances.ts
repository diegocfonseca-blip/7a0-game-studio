// ─── 🎙️ O LANCE DO GOL — como a bola entrou ─────────────────────────────────
//
// Pedido do Diego (19/09), sobre dar emoção ao placar: *"é sobre lances rolando, como
// driblou, driblou dois, falta a ser batida, escanteio, gol olímpico, tabelou, deu uns
// dribles da vaga e chutou de fora da área, chutou cruzado… só colocou pra dentro na
// cara do gol. Queria muitas e muitas e muitas frases, porque senão fica chato
// repetindo toda hora as mesmas coisas — o acervo tem que ser grande, e alguns até
// cômicos, como gol de barriga após um lindo cruzamento. Mas também não exagere no
// cômico."*
//
// Regras da casa que valem aqui:
//  · 🚫 SEM SPOILER: a frase só nasce quando o gol JÁ apareceu na tela (quem chama é o
//    placar, depois do relógio passar do minuto do gol).
//  · 🎲 DETERMINÍSTICA: o mesmo gol dá sempre a mesma frase (sorteio pelo nome, minuto e
//    rodada) — no online a sala inteira lê o mesmo lance, e o texto não troca a cada
//    tique do relógio.
//  · 🅰️ Se o gol tem ASSISTÊNCIA, o lance cita quem deu o passe (o `assist` já vem
//    do motor). Sem assistência, é jogada individual, bola parada ou rebote.
//  · 🌐 PT e EN com a MESMA quantidade de frases em cada banco (o sorteio é por índice).
//  · 😄 Cômico com moderação: uma a cada ~8 frases, e nada que humilhe o jogador de
//    verdade (nomes reais — regra do "não inventar como uma pessoa é").
//  · ⚽🚫 NADA DE PÊNALTI AQUI (Diego 19/09): *"texto de pênalti não pode ter, porque
//    quando é pênalti tem batida manual pra eu bater, lembra?"*. O pênalti tem tela
//    própria (mira + barra de força, `PENALTY_ART_RELEASED`), então narrar "pênalti no
//    canto" num gol de jogada normal seria contar uma história que não aconteceu — e
//    comportamento fora das regras mapeadas é bug, não sabor.
import { getLang } from './lang'

type Par = [pt: string, en: string]

// {n} = quem marcou · {a} = quem deu o passe
const COM_ASSIST: Par[] = [
  ['{a} cruzou na medida e {n} subiu mais que todo mundo: de cabeça, no canto', '{a} whipped in a perfect cross and {n} rose above everyone: header into the corner'],
  ['tabelinha de {n} com {a} e {n} só teve o trabalho de empurrar pra dentro', 'a one-two between {n} and {a} and {n} just had to tap it in'],
  ['{a} enfiou a bola entre os zagueiros e {n} bateu cruzado, sem chance pro goleiro', '{a} slid the ball between the defenders and {n} hit it across goal, no chance for the keeper'],
  ['escanteio de {a} e {n} de barriga, após um lindo cruzamento', 'corner from {a} and {n} scores with the belly, after a lovely cross'],
  ['{a} rolou pra trás e {n} chegou batendo de primeira, de fora da área', '{a} pulled it back and {n} arrived to hit it first time from outside the box'],
  ['contra-ataque fulminante: {a} correu 40 metros e serviu {n} na cara do gol', 'a lightning counter: {a} ran 40 metres and set up {n} in front of goal'],
  ['{a} levantou na segunda trave e {n} apareceu sozinho pra completar', '{a} floated it to the far post and {n} showed up all alone to finish'],
  ['passe açucarado de {a} e {n} tocou por cobertura, na saída do goleiro', 'a sugar-sweet pass from {a} and {n} chipped the keeper as he came out'],
  ['{a} cobrou a falta na área e {n} desviou de cabeça no primeiro pau', '{a} took the free kick into the box and {n} glanced it in at the near post'],
  ['{a} driblou dois e deu de bandeja pra {n} só empurrar', '{a} beat two men and handed it on a plate for {n} to push in'],
  ['lançamento de {a} nas costas da zaga e {n} dominou e bateu no cantinho', 'a ball from {a} in behind the defence and {n} controlled and slotted into the corner'],
  ['{a} cruzou rasteiro e {n} chegou deslizando pra completar', '{a} drilled it low across and {n} slid in to finish'],
  ['{a} cobrou o escanteio curto, recebeu de volta e achou {n} livre na pequena área', '{a} took the corner short, got it back and found {n} free in the six-yard box'],
  ['{n} recebeu de {a}, girou em cima do marcador e soltou a bomba', '{n} took the pass from {a}, spun past the marker and let fly'],
  ['{a} tocou de calcanhar, {n} apareceu e bateu colocado no ângulo', '{a} back-heeled it, {n} appeared and curled it into the top corner'],
  ['{a} cruzou, a zaga cortou mal e {n} pegou a sobra: gol', '{a} crossed, the defence cleared badly and {n} pounced on the loose ball: goal'],
  ['{a} cruzou da direita e {n} fez de peixinho, mergulhando entre os zagueiros', '{a} crossed from the right and {n} scored with a diving header between the defenders'],
  ['{n} pediu, {a} entregou, e a finalização saiu de primeira, rasteira, no canto', '{n} called for it, {a} delivered, and the first-time finish went low into the corner'],
  ['{a} tabelou, devolveu de letra e {n} completou de canela — valeu do mesmo jeito', '{a} played the one-two, returned it with a flick and {n} finished off his shin — it still counts'],
  ['{a} carregou pelo meio e abriu pra {n}, que ajeitou e chutou cruzado', '{a} carried it through the middle and released {n}, who set himself and shot across goal'],
  ['{a} cruzou, o goleiro espalmou e {n} completou de cabeça no rebote', '{a} crossed, the keeper parried and {n} headed in the rebound'],
  ['{a} bateu o escanteio fechado e {n} desviou de leve, o suficiente', '{a} curled the corner in and {n} got the slightest of touches, enough'],
  ['cruzamento de {a} e {n} dominou no peito e bateu no contrapé do goleiro', 'cross from {a} and {n} chested it down and wrong-footed the keeper'],
  ['{n} recebeu de {a} pela esquerda, cortou pra dentro e bateu de trivela', '{n} took it from {a} on the left, cut inside and scored with the outside of the boot'],
  ['{a} deu o passe, {n} tocou por cima do goleiro e correu pra torcida', '{a} played the pass, {n} lobbed the keeper and ran to the fans'],
  ['{a} escapou pela ponta e cruzou pra {n} fechar o gol na segunda trave', '{a} got free down the wing and crossed for {n} to close it out at the far post'],
  ['{a} cobrou o lateral longo, a bola sobrou e {n} finalizou de primeira', '{a} launched the long throw, it dropped loose and {n} finished first time'],
  ['assistência de {a} e {n} chutou tão forte que o goleiro nem viu', 'assist from {a} and {n} hit it so hard the keeper never saw it'],
  ['{a} tocou de primeira e {n} bateu por baixo do goleiro', '{a} played it first time and {n} slotted it under the keeper'],
  ['{a} inverteu o jogo e {n} chegou batendo de fora da área, no ângulo', '{a} switched play and {n} arrived to hit it from outside the box into the top corner'],
  ['{a} cruzou e a bola bateu em {n} e entrou. Ele vai dizer que foi de propósito', '{a} crossed and the ball hit {n} and went in. He will say he meant it'],
  ['{a} passou entre as pernas do zagueiro e {n} finalizou com categoria', '{a} nutmegged the defender and {n} finished with class'],
]

const SEM_ASSIST: Par[] = [
  ['driblou dois e chutou de fora da área: golaço', 'beat two men and shot from outside the box: what a goal'],
  ['gol olímpico! Direto do escanteio, a bola morreu no ângulo', 'straight from the corner! The ball died in the top corner'],
  ['pegou o rebote e só colocou pra dentro na cara do gol', 'picked up the rebound and just placed it in from point-blank range'],
  ['falta batida com efeito, por cima da barreira, no cantinho', 'a curling free kick over the wall, into the corner'],
  ['puxou pra perna boa e soltou uma bomba de fora da área', 'shifted onto his good foot and unleashed a rocket from outside the box'],
  ['girou em cima do zagueiro na entrada da área e bateu sem deixar cair', 'spun past the defender at the edge of the box and hit it on the volley'],
  ['chapéu no zagueiro e toque por cobertura na saída do goleiro', 'flicked it over the defender and chipped the keeper as he came out'],
  ['roubou a bola no meio-campo, saiu cara a cara e bateu rasteiro', 'stole the ball in midfield, went one on one and shot low'],
  ['deu uns dribles da vaga e chutou cruzado, sem chance', 'a couple of quick dribbles and a shot across goal, no chance'],
  ['chute de longe que quicou na frente do goleiro e entrou', 'a long-range shot that bounced in front of the keeper and went in'],
  ['recebeu na entrada da área, ajeitou e bateu colocado', 'received at the edge of the box, set himself and curled it in'],
  ['cabeceou no escanteio, o goleiro rebateu e ele completou de novo', 'headed the corner, the keeper parried and he finished the rebound'],
  ['tirou o zagueiro do caminho e bateu no ângulo', 'moved the defender out of the way and hit the top corner'],
  ['falta batida rasteira por baixo da barreira, que pulou', 'a low free kick under the wall, which jumped'],
  ['bicicleta! Sim, bicicleta, no meio da área', 'bicycle kick! Yes, a bicycle kick, in the middle of the box'],
  ['pegou de primeira uma bola que sobrou na entrada da área', 'hit first time a ball that dropped at the edge of the box'],
  ['tirou o goleiro da jogada com um toque de cavadinha. Coragem', 'took the keeper out of the play with a cheeky chip. Brave'],
  ['bateu mal, a bola desviou na zaga e enganou o goleiro', 'mishit it, the ball deflected off a defender and fooled the keeper'],
  ['entrou driblando pela ponta, cortou pra dentro e bateu cruzado', 'dribbled in from the wing, cut inside and shot across goal'],
  ['cobrança de falta direta e o goleiro engoliu um frango', 'direct free kick and the keeper let one slip through'],
  ['aproveitou a saída errada do goleiro e chutou de longe, no gol vazio', 'punished the keeper for coming out and shot from distance into the empty net'],
  ['bateu de trivela de fora da área e a bola fez a curva', 'hit it with the outside of the boot from range and it curled in'],
  ['recebeu de costas, girou e bateu de primeira', 'took it with his back to goal, turned and shot first time'],
  ['gol de peito? Gol de peito. A bola quicou e ele empurrou', 'chest goal? Chest goal. It bounced and he shoved it over the line'],
  ['ganhou no corpo do zagueiro e finalizou por baixo do goleiro', 'muscled past the defender and slotted it under the keeper'],
  ['chute despretensioso da intermediária que ninguém esperava', 'a hopeful strike from midfield that nobody expected'],
  ['driblou o goleiro e tocou pro gol vazio, sem pressa', 'rounded the keeper and rolled it into the empty net, no rush'],
  ['pegou a sobra do escanteio e bateu de primeira, rasteiro', 'got the loose ball from the corner and hit it first time, low'],
  ['gol de cabeça depois de um cruzamento que ninguém cortou', 'a header after a cross nobody dealt with'],
  ['chutou forte no meio do gol e o goleiro pulou pro canto', 'blasted it down the middle and the keeper dived to the corner'],
  ['finalização de fora da área que explodiu no travessão e entrou', 'a shot from outside the box that smashed the bar and went in'],
  ['tocou de letra na pequena área. Não faz sentido, mas entrou', 'a flick with the back of the boot in the six-yard box. Makes no sense, but it went in'],
  ['gol de barriga, sem querer, depois de escorregar na área', 'a belly goal, by accident, after slipping in the box'],
  ['arrancada de 50 metros e chute cruzado no fim da corrida', 'a 50-metre run and a shot across goal at the end of it'],
  ['aproveitou a bola espirrada na área e bateu por cima da defesa', 'took the loose ball in the box and lifted it over the defence'],
  ['cobrança de falta de dois dedos, colocada no cantinho', 'a placed free kick with the outside of the foot, into the corner'],
  ['chute rasteiro no canto, com o goleiro tampado pela zaga', 'a low shot into the corner, with the keeper unsighted by his own defence'],
  ['bateu de canhota, colocado, sem dar chance', 'a placed left-footed shot, no chance'],
  ['gol contra da zaga adversária — mas ele chutou, então é dele', 'an own goal by the defence — but he shot, so it is his'],
  ['puxou o contra-ataque sozinho e concluiu com um toque de classe', 'led the counter alone and finished with a touch of class'],
  ['recebeu na área, deu uma caneta no zagueiro e bateu no canto', 'took it in the box, nutmegged the defender and shot into the corner'],
  ['gol de chaleira! O goleiro voltou e a bola já tinha entrado', 'a scooped lob! The keeper turned round and the ball was already in'],
  ['cobrou a falta rasteira no canto que a barreira deixou aberto', 'a low free kick into the corner the wall left open'],
  ['chute de primeira do meio da rua, no ângulo', 'a first-time shot from way out, into the top corner'],
  ['carrinho na pequena área pra empurrar a bola que sobrou', 'a sliding finish in the six-yard box on the loose ball'],
  ['gol de cabeça depois de a bola quicar duas vezes na área', 'a header after the ball bounced twice in the box'],
  ['matou no peito, deixou quicar e bateu de voleio', 'chested it down, let it bounce and volleyed it in'],
  ['finalização de canela que enganou todo mundo, inclusive ele', 'a shin finish that fooled everyone, including him'],
]

// 🎲 sorteio estável: nome + minuto + rodada → sempre a mesma frase pro mesmo gol
function semente(txt: string, min: number, rodada: number): number {
  let h = 7 + min * 31 + Math.abs(rodada) * 131
  for (let i = 0; i < txt.length; i++) h = (h * 33 + txt.charCodeAt(i)) >>> 0
  return h
}

/** o lance do gol, no idioma do site. `assist` vazio = jogada individual/bola parada. */
export function lanceDoGol(g: { name: string; min: number; assist?: string }, rodada = 0): string {
  const en = getLang() === 'en'
  const banco = g.assist ? COM_ASSIST : SEM_ASSIST
  const par = banco[semente(g.name + '|' + (g.assist ?? ''), g.min, rodada) % banco.length]
  return (en ? par[1] : par[0]).replace(/\{n\}/g, g.name).replace(/\{a\}/g, g.assist ?? '')
}

/** quantas frases existem (pra trava/teste): [com assistência, sem assistência] */
export const TAMANHO_ACERVO: [number, number] = [COM_ASSIST.length, SEM_ASSIST.length]
