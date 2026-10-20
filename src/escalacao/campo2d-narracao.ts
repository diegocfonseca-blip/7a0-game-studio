// 🎙️ NARRAÇÃO DO CAMPO 2D — o banco de frases (20/10). Diego: *"as narrações têm que acompanhar tudo que acontece no jogo e
// também devem ter variedade"*. Cada acontecimento tem VÁRIAS versões, em PT e EN na MESMA posição (quem adicionar frase, adiciona
// nas duas). O motor sorteia uma pelo dado do jogo (determinístico: todo aparelho da sala lê a mesma). {a} {b} {c} são os nomes.
// Regra da casa (19/09): NUNCA frase de pênalti — pênalti tem tela própria.
export type ChaveNarra =
  | 'saida' | 'saida_casa' | 'saida_fora' | 'lateral' | 'tiro_meta' | 'escanteio' | 'escanteio_cobra' | 'escanteio_desvio' | 'falta' | 'falta_cobra'
  | 'rouba' | 'intercepta' | 'carrinho_lateral' | 'afasta_lateral' | 'zaga_corta' | 'zaga_cabeca' | 'goleiro_pes' | 'recua_goleiro' | 'lancamento_longo' | 'posse' | 'toca' | 'inverte'
  | 'tenta_drible' | 'parte_pra_cima' | 'drible_passou' | 'tabela' | 'contra' | 'dispara' | 'enfia' | 'linha_fundo' | 'cruzou' | 'arrisca' | 'espalma'
  | 'lanc_olha' | 'lanc_bola' | 'domina' | 'avanca_lado' | 'rola_na_frente' | 'individual' | 'ensaiada_1' | 'ensaiada_2' | 'zaga_roda' | 'pressiona' | 'erro_zaga' | 'gol_vazio' | 'dribla_goleiro'
  | 'defendeu' | 'trave' | 'fora' | 'isolou' | 'avanca' | 'toca_na_frente'

const B: Record<ChaveNarra, [string[], string[]]> = {
  saida: [['Bola no meio.', 'Recomeça o jogo.', 'Volta pro centro do campo.'], ['Back to the centre spot.', 'Play restarts.', 'Ball back on the centre circle.']],
  saida_casa: [['Saída do time da casa.', 'Mandante dá a saída.', 'O time da casa repõe no meio.'], ['Home side kicks off.', 'The hosts restart.', 'Home team gets us going again.']],
  saida_fora: [['Saída do visitante.', 'O visitante dá a saída.', 'Recomeça com o visitante.'], ['Visitors kick off.', 'The away side restarts.', 'Back underway with the visitors.']],
  lateral: [['Lateral. {a} vai cobrar.', 'Saiu pela lateral — cobra {a}.', 'Arremesso lateral com {a}.', '{a} vai pra linha cobrar o lateral.'], ['Throw-in. {a} takes it.', 'Out for a throw — {a} with it.', '{a} with the throw-in.', '{a} over to take the throw.']],
  tiro_meta: [['Tiro de meta.', 'Bola pela linha de fundo: tiro de meta.', 'O goleiro vai repor: tiro de meta.', 'Saiu pela linha de fundo. Tiro de meta.'], ['Goal kick.', 'Behind for a goal kick.', 'The keeper will restart: goal kick.', 'Out over the byline. Goal kick.']],
  escanteio: [['Escanteio!', 'Córner pro ataque!', 'Vai ter escanteio.', 'Bola na bandeirinha: escanteio!'], ['Corner!', 'Corner kick to the attack!', "It'll be a corner.", 'Over to the flag: corner!']],
  escanteio_cobra: [['{a} cobra o escanteio…', '{a} levanta na área…', '{a} bate o córner, bola na área…', 'Cobrança de {a}, bola fechada…'], ['{a} swings in the corner…', '{a} floats it into the box…', '{a} takes the corner, into the area…', '{a} delivers, an inswinger…']],
  escanteio_desvio: [['Cruzou… a zaga desvia! Escanteio.', 'Bola cruzada e a defesa manda pra linha de fundo. Escanteio!', 'Tirou a zaga… pela linha de fundo: córner.'], ['Crossed… deflected behind! Corner.', 'The cross is turned behind. Corner!', 'Cleared… over the byline: corner.']],
  falta: [['FALTA! {a} derruba {b}.', 'FALTA de {a} em cima de {b}!', '{a} chega atrasado e derruba {b}. Falta!', 'Apitou: falta de {a} em {b}.'], ['FOUL! {a} brings down {b}.', 'FOUL by {a} on {b}!', '{a} is late and fells {b}. Free kick!', 'Whistle: foul by {a} on {b}.']],
  falta_cobra: [['{a} vai pra cobrança…', 'Barreira armada, {a} na bola…', '{a} ajeita a bola pra falta…'], ['{a} steps up…', 'Wall set, {a} over the ball…', '{a} lines up the free kick…']],
  rouba: [['{a} chega firme e rouba a bola!', '{a} dá o bote e fica com ela!', 'Desarme de {a}!', '{a} toma a bola no bote!'], ['{a} goes in hard and wins the ball!', '{a} nicks it away!', 'Tackle by {a}!', '{a} wins it with a crunching tackle!']],
  intercepta: [['{a} intercepta o passe.', '{a} lê a jogada e corta o passe.', 'Passe errado: {a} fica com a bola.', '{a} se antecipa e pega.'], ['{a} cuts out the pass.', '{a} reads it and intercepts.', 'Misplaced pass: {a} picks it up.', '{a} steps in front and takes it.']],
  carrinho_lateral: [['{a} chega no carrinho e manda pra lateral!', 'Carrinho de {a}! Bola pra lateral.', '{a} se joga no chão e tira pra lateral.'], ['{a} slides in and puts it out for a throw!', 'Sliding tackle by {a}! Out for a throw.', '{a} goes to ground and clears for a throw.']],
  afasta_lateral: [['{a} afasta pela lateral.', '{a} manda pra fora, lateral.', '{a} não arrisca: pra lateral.'], ['{a} knocks it out for a throw.', '{a} puts it out, throw-in.', "{a} doesn't risk it: out for a throw."]],
  zaga_corta: [['O cruzamento sai… e a zaga corta.', 'Bola na área… cortada pela defesa.', 'Cruzamento… a zaga afasta de cabeça.'], ["The cross comes in… and it's cleared.", 'Into the box… the defence clears.', 'Cross… headed away.']],
  zaga_cabeca: [['{a} sobe mais alto e afasta!', '{a} ganha no alto e tira!', 'Corte de cabeça de {a}!'], ['{a} gets up highest and clears!', '{a} wins the header and clears!', 'Headed clear by {a}!']],
  goleiro_pes: [['{a} sai jogando com os pés, com toda a calma.', '{a} rola curto, sem pressa.', '{a} prefere sair jogando.'], ['{a} plays out from the back, cool as you like.', '{a} rolls it short, no rush.', '{a} opts to play it short.']],
  recua_goleiro: [['Recua pro {a}.', 'Bola de volta pro {a}.', 'Toca atrás pro {a}.'], ['Back to {a}.', 'Ball back to {a}.', 'Played back to {a}.']],
  lancamento_longo: [['Lançamento longo procurando {a}…', 'Bola longa na direção de {a}…', 'Chutão pra frente, {a} vai na bola…'], ['A long ball looking for {a}…', 'Launched forward towards {a}…', 'Hoofed long, {a} chases it…']],
  posse: [['O {a} roda a bola com paciência.', 'O {a} troca passes no meio-campo.', 'O {a} segura a bola, sem pressa.', 'Toca de um lado pro outro, o {a} controla.'], ['{a} keep the ball patiently.', '{a} pass it around midfield.', '{a} hold onto it, no rush.', 'Side to side, {a} in control.']],
  toca: [['{a} toca com {b}…', '{a} ajeita pra {b}…', '{a} e {b} trocam passes…'], ['{a} plays it to {b}…', '{a} lays it off to {b}…', '{a} and {b} exchange passes…']],
  inverte: [['{a} inverte o jogo pro {b}.', '{a} muda o lado da jogada: {b} aparece livre.', 'Bola longa de {a} trocando a ponta pra {b}.'], ['{a} switches play to {b}.', '{a} changes the angle: {b} is free.', 'Cross-field ball from {a} to {b}.']],
  tenta_drible: [['{a} tenta o drible…', '{a} encara o marcador…', '{a} quer passar no um contra um…'], ['{a} tries to take him on…', '{a} squares up to the marker…', '{a} wants the one-on-one…']],
  parte_pra_cima: [['{a} parte pra cima da marcação…', '{a} arranca com a bola dominada…', '{a} encara a zaga…'], ['{a} runs at the defence…', '{a} drives forward with the ball…', '{a} takes on the back line…']],
  drible_passou: [['…e passa como quer! Que drible de {a}!', '…deixou o marcador no chão! {a}!', '…que jogada de {a}, limpou o lance!'], ['…and skips past! What a dribble by {a}!', '…leaves the marker on the floor! {a}!', '…brilliant from {a}, past him!']],
  tabela: [['{a} tabela com {b}…', 'Tabelinha: {a} e {b}…', '{a} toca e vai, {b} devolve…'], ['{a} plays a one-two with {b}…', 'Give-and-go: {a} and {b}…', '{a} plays and goes, {b} returns it…']],
  contra: [['Contra-ataque!', 'Saiu rápido no contra-ataque!', 'Roubou e já vai no contra!', 'Transição rápida!'], ['Counter-attack!', 'Breaking fast on the counter!', 'Won it and straight on the break!', 'Quick transition!']],
  dispara: [['{a} dispara em velocidade…', '{a} abre a passada…', '{a} sai em disparada, ninguém alcança…'], ['{a} races away…', '{a} opens up his stride…', '{a} sprints clear, nobody can catch him…']],
  enfia: [['{a} levanta a cabeça e ENFIA pro {b}!', '{a} vê o {b} e rasga a defesa!', 'Passe açucarado de {a} pro {b}!', '{a} enfia entre os zagueiros: {b} na jogada!'], ['{a} looks up and THREADS it through to {b}!', '{a} spots {b} and splits the defence!', 'Inch-perfect pass from {a} to {b}!', '{a} slides it between the centre-backs: {b} is in!']],
  linha_fundo: [['{a} vai à linha de fundo…', '{a} chega na linha de fundo…', '{a} ganha a linha pela ponta…'], ['{a} gets to the byline…', '{a} reaches the byline…', '{a} wins the line down the wing…']],
  cruzou: [['Cruzou na área!', 'Bola levantada na área!', 'Cruzamento fechado!'], ['Cross into the box!', 'Ball into the area!', 'Whipped cross!']],
  arrisca: [['{a} arrisca de longe…', '{a} tenta de fora da área…', '{a} manda a bomba de longe…'], ['{a} has a go from range…', '{a} tries from outside the box…', '{a} lets one fly from distance…']],
  espalma: [['{a} ESPALMA… a bola sobra na área!', '{a} rebate… e a bola fica viva!', 'Defesa de {a}, mas a bola volta pra área!'], ['{a} PARRIES… it drops in the box!', '{a} pushes it away… and it stays live!', '{a} saves, but it comes back out!']],
  lanc_olha: [['{a} levanta a cabeça e vê o {b} partindo…', '{a} olha pro ataque: {b} pede nas costas…', '{a} mede o lançamento pro {b}…'], ['{a} looks up and spots {b} making the run…', '{a} looks forward: {b} wants it in behind…', '{a} sizes up the ball to {b}…']],
  lanc_bola: [['LANÇAMENTO de {a} nas costas da zaga!', 'Que lançamento de {a}! A zaga ficou pra trás!', '{a} lança por cima da defesa!'], ['LONG BALL from {a} in behind the defence!', 'What a pass from {a}! The defence is beaten!', '{a} lofts it over the back line!']],
  domina: [['{a} domina no peito…', '{a} mata no peito…', '{a} amortece a bola…'], ['{a} brings it down on his chest…', '{a} controls it on the chest…', '{a} cushions the ball…']],
  avanca_lado: [['{a} avança pela {b}…', '{a} sobe pela {b}…', '{a} apoia pela {b}…'], ['{a} drives down the {b}…', '{a} pushes up the {b}…', '{a} overlaps down the {b}…']],
  rola_na_frente: [['{a} rola na frente pro {b} chegar batendo!', '{a} deixa de calcanhar… {b} vem de trás!', 'Passe na frente de {a}: {b} chega!'], ['{a} rolls it ahead for {b} to run onto!', '{a} lays it off… {b} arriving late!', 'Ball ahead from {a}: {b} is onto it!']],
  individual: [['{a} recebe e parte pra jogada individual…', '{a} quer resolver sozinho…', '{a} pede a bola e vai…'], ['{a} picks it up and goes it alone…', '{a} wants to do it himself…', '{a} calls for it and goes…']],
  ensaiada_1: [['Cobrança curta, ENSAIADA: {a} toca pro {b}…', 'Jogada ensaiada! {a} rola curto pro {b}…', 'Córner curto de {a} pro {b}…'], ['Short corner, a REHEARSED move: {a} plays it to {b}…', 'Set-piece routine! {a} plays it short to {b}…', 'Short corner from {a} to {b}…']],
  ensaiada_2: [['…e {a} rola pra trás, pro {b} que vem de longe!', '…{a} devolve de primeira pro {b}!', '…{a} rola na marca do pênalti: {b} chega!'], ['…and {a} pulls it back for {b} arriving late!', '…{a} returns it first time to {b}!', '…{a} squares it to the spot: {b} is there!']],
  zaga_roda: [['{a} roda a bola na defesa…', '{a} sai jogando devagar…', '{a} segura a bola lá atrás…'], ['{a} plays it around at the back…', '{a} brings it out slowly…', '{a} holds it at the back…']],
  pressiona: [['{a} pressiona…', '{a} vai pra cima da zaga…', '{a} aperta a saída de bola…'], ['{a} presses…', '{a} closes down the defence…', '{a} hounds the build-up…']],
  erro_zaga: [['ERRO de {a}! {b} rouba a bola na área!', 'VACILOU {a}! {b} tomou a bola!', '{a} perde a bola pro {b} dentro da área!'], ['MISTAKE by {a}! {b} steals it in the box!', '{a} DITHERS! {b} robs him!', '{a} loses it to {b} inside the area!']],
  gol_vazio: [['{a} com o gol vazio…', '{a} só tem o gol pela frente…', '{a}, gol escancarado…'], ['{a} with the goal at his mercy…', '{a} has only the net in front…', '{a}, open goal…']],
  dribla_goleiro: [['{a} DRIBLA O GOLEIRO!', '{a} passa pelo goleiro!', '{a} tira o goleiro da jogada!'], ['{a} ROUNDS THE KEEPER!', '{a} goes past the keeper!', '{a} takes the keeper out of it!']],
  defendeu: [['Que defesa! O goleiro buscou!', 'DEFENDEU! O goleiro salvou!', 'Grande defesa! Tirou do gol!', 'O goleiro espalma e salva!'], ['What a save!', 'SAVED! The keeper comes up big!', 'Great stop! Kept it out!', 'The keeper parries it clear!']],
  trave: [['NA TRAVE! Quase!', 'Tremeu a trave!', 'Explodiu na trave!', 'Trave! Que azar!'], ['OFF THE POST!', 'Rattled the post!', 'Smashed against the woodwork!', 'Post! So unlucky!']],
  fora: [['Pra fora, raspando a trave!', 'Passou perto! Tirou tinta da trave.', 'Pra fora, por muito pouco!', 'Saiu raspando!'], ['Just wide!', 'So close! Shaved the post.', 'Wide, by a whisker!', 'Just past the post!']],
  avanca: [['{a} avança com a bola dominada…', '{a} carrega a bola pro ataque…', '{a} sobe com a bola, o time vai junto…', '{a} conduz, olhando o passe…'], ['{a} drives forward with the ball…', '{a} carries it into the attack…', '{a} pushes up, the team follows…', '{a} on the ball, looking for the pass…']],
  toca_na_frente: [['{a} toca na frente pro {b}…', '{a} lança o {b} no ataque…', 'Bola de {a} pro {b}, que aparece na frente…'], ['{a} plays it forward to {b}…', '{a} sends {b} into the attack…', 'Ball from {a} to {b}, showing up front…']],
  isolou: [['Isolou! A bola foi pra arquibancada.', 'Mandou pra torcida!', 'Por cima, muito por cima!', 'Chutou pra lua!'], ['Blazed over the bar!', 'Into the stands!', 'Over, well over!', 'Into orbit!']],
}

/** sorteia uma versão e troca {a} {b} {c} */
export function frase(k: ChaveNarra, en: boolean, r: number, vars: Record<string, string> = {}): string {
  const lista = B[k][en ? 1 : 0]
  let s = lista[Math.min(lista.length - 1, Math.floor(r * lista.length))]
  for (const [key, v] of Object.entries(vars)) s = s.split(`{${key}}`).join(v)
  return s
}
/** tamanho de cada banco (pra trava): PT e EN têm que ter o mesmo número de frases */
export const ACERVO_NARRA = Object.fromEntries(Object.entries(B).map(([k, v]) => [k, [v[0].length, v[1].length]])) as Record<ChaveNarra, [number, number]>
