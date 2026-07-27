// 🏀 BARALHO DO BIDLEGENDS (NBA) — Lote 1
//
// Espelha o baralho do futebol (`data.ts`), mas cada carta já nasce BILÍNGUE
// (bioPt + bioEn) porque o basquete é internacional. Mesma régua de nível:
//   fame 5 = 👑 LENDA · 4 = ⭐ CRAQUE · 3/2 = 🎯 BOM · 1 = 🪵 FOI PROFISSIONAL
//   promessa:true = 💎 PROMESSA (auge ainda de promessa) · folk:true = 🃏 (vibe)
// `lo/hi` = faixa de overall (baixo/alto) no dia — igual ao futebol.
//
// Nível = auge NAQUELE ano/franquia (Jordan Bulls 1996 lenda; Wade Heat 2006).
// Arquivo self-contained (sem imports) pra facilitar prévia/teste antes do motor.
//
// 5 posições mapeiam 1:1 nos 5 setores do leilão:
//   PG armador · SG ala-armador · SF ala · PF ala-pivô · C pivô.

export type BPos = 'PG' | 'SG' | 'SF' | 'PF' | 'C'
export type BFame = 1 | 2 | 3 | 4 | 5

export type BC = {
  name: string; club: string; year: number
  fame: BFame; lo: number; hi: number
  bioPt: string; bioEn: string
  folk?: boolean; promessa?: boolean
}

// nome cheio de cada posição (título da rodada de pregão) — bilíngue. O código
// curto (PG/SG/SF/PF/C) é padrão NBA e serve nas duas línguas, vai direto na carta.
export const BPOS_LABEL: Record<BPos, { pt: string; en: string }> = {
  PG: { pt: 'Armador', en: 'Point Guard' },
  SG: { pt: 'Ala-armador', en: 'Shooting Guard' },
  SF: { pt: 'Ala', en: 'Small Forward' },
  PF: { pt: 'Ala-pivô', en: 'Power Forward' },
  C: { pt: 'Pivô', en: 'Center' },
}

// ─── PG · ARMADOR ────────────────────────────────────────────────────
const PG: BC[] = [
  { name: 'Magic Johnson', club: 'Lakers', year: 1987, fame: 5, lo: 90, hi: 97, bioPt: 'Showtime em pessoa: 2,06m de armador que enxergava o passe antes de todo mundo. 5 anéis.', bioEn: 'Showtime in the flesh: a 6\'9" point guard who saw the pass before anyone. 5 rings.' },
  { name: 'Stephen Curry', club: 'Warriors', year: 2016, fame: 5, lo: 90, hi: 97, bioPt: 'Quebrou a NBA de três. MVP unânime e mira de outro planeta lá do meio da quadra.', bioEn: 'Broke the NBA from deep. Unanimous MVP with logo-range aim from another planet.' },
  { name: 'Isiah Thomas', club: 'Pistons', year: 1989, fame: 5, lo: 88, hi: 94, bioPt: 'O baixinho durão dos Bad Boys. Sorriso de anjo, jogo de bandido. Bicampeão.', bioEn: 'The tough little floor general of the Bad Boys. Angel smile, villain game. Back-to-back champ.' },
  { name: 'Allen Iverson', club: 'Sixers', year: 2001, fame: 4, lo: 86, hi: 93, bioPt: '1,83m que atravessava gigantes. "We talking about practice?" MVP de puro coração.', bioEn: 'Six-foot flat, crossing over giants. "We talking about practice?" An MVP of pure heart.' },
  { name: 'Steve Nash', club: 'Suns', year: 2005, fame: 4, lo: 85, hi: 92, bioPt: 'Cabelo no rosto, passe nas costas. Dois MVPs correndo o "sete segundos ou menos".', bioEn: 'Hair in the face, no-look dimes. Two MVPs running seven-seconds-or-less.' },
  { name: 'John Stockton', club: 'Jazz', year: 1990, fame: 4, lo: 84, hi: 91, bioPt: 'Rei eterno das assistências e dos roubos. Shortinho curto e sacanagem no pick-and-roll.', bioEn: 'All-time king of assists and steals — forever. Tiny shorts, deadly pick-and-roll.' },
  { name: 'Damian Lillard', club: 'Blazers', year: 2019, fame: 4, lo: 84, hi: 91, bioPt: 'Dame Time. Acenou tchau pro OKC do meio da quadra e foi embora de boa.', bioEn: 'Dame Time. Waved goodbye to OKC from the logo and strolled off.' },
  { name: 'Chris Paul', club: 'Hornets', year: 2008, fame: 4, lo: 84, hi: 90, bioPt: 'O Point God. Controla o jogo no relógio e reclama com o árbitro em dobro.', bioEn: 'The Point God. Runs the game on a clock and argues with refs twice as hard.' },
  { name: 'Kyrie Irving', club: 'Cavaliers', year: 2016, fame: 4, lo: 84, hi: 91, bioPt: 'Drible de outra dimensão e a bola de 3 que calou os Warriors em 2016.', bioEn: 'Handles from another dimension and the 2016 dagger three that silenced the Warriors.' },
  { name: 'Ja Morant', club: 'Grizzlies', year: 2022, fame: 3, lo: 78, hi: 88, promessa: true, bioPt: 'Voa mais alto do que armador tem direito. Pura eletricidade vinda de Memphis.', bioEn: 'Flies higher than a guard has any right to. Pure Memphis electricity.' },
  { name: 'Jeremy Lin', club: 'Knicks', year: 2012, fame: 2, lo: 66, hi: 83, folk: true, bioPt: 'LINSANITY. Duas semanas em que o mundo inteiro virou torcedor dos Knicks.', bioEn: 'LINSANITY. Two weeks when the whole world became Knicks fans.' },
  // ── Lote 2 ──
  { name: 'Russell Westbrook', club: 'Thunder', year: 2017, fame: 4, lo: 86, hi: 93, bioPt: 'Máquina de triple-double e MVP. "Why not?" e a roupa mais doida do vestiário.', bioEn: 'A triple-double machine and MVP. "Why not?" and the wildest outfits in the locker room.' },
  { name: 'Derrick Rose', club: 'Bulls', year: 2011, fame: 4, lo: 85, hi: 92, bioPt: 'O MVP mais jovem da história. O joelho traiu o sonho, mas Chicago nunca esqueceu.', bioEn: 'The youngest MVP ever. His knee betrayed the dream, but Chicago never forgot.' },
  { name: 'Tony Parker', club: 'Spurs', year: 2007, fame: 4, lo: 84, hi: 90, bioPt: 'Francês veloz, floater no garrafão e MVP de final. O motorzinho dos Spurs campeões.', bioEn: 'A speedy Frenchman, floaters in the paint and a Finals MVP. The engine of the champion Spurs.' },
  { name: 'Jason Williams (White Chocolate)', club: 'Kings', year: 2002, fame: 3, lo: 78, hi: 86, folk: true, bioPt: 'Passe de cotovelo, elastic pass, o playground na NBA. Mais firula que troféu.', bioEn: 'Elbow passes, the elastic pass, the playground in the NBA. More flash than trophies.' },
  { name: 'Muggsy Bogues', club: 'Hornets', year: 1994, fame: 2, lo: 64, hi: 82, folk: true, bioPt: '1,60m — o menor da história — roubando a bola dos gigantes. Tamanho não é tudo.', bioEn: 'Five-foot-three — the shortest ever — stealing the ball from giants. Size isn\'t everything.' },
  { name: 'Marcelinho Huertas', club: 'Lakers', year: 2016, fame: 1, lo: 58, hi: 77, folk: true, bioPt: 'Brasileiro de passe mágico que jogou na NBA e nunca para de jogar. Eterno cérebro. 🇧🇷', bioEn: 'A Brazilian magician who made the NBA and just never stops playing. An eternal floor general. 🇧🇷' },
]

// ─── SG · ALA-ARMADOR ────────────────────────────────────────────────
const SG: BC[] = [
  { name: 'Michael Jordan', club: 'Bulls', year: 1996, fame: 5, lo: 93, hi: 99, bioPt: 'O melhor de todos. 6 finais, 6 anéis, 6 MVPs de final. Fim de papo.', bioEn: 'The greatest of all time. 6 Finals, 6 rings, 6 Finals MVPs. End of debate.' },
  { name: 'Kobe Bryant', club: 'Lakers', year: 2008, fame: 5, lo: 91, hi: 97, bioPt: 'Mamba Mentality. 81 pontos num jogo, 5 anéis e obsessão total por vencer. Eterno.', bioEn: 'Mamba Mentality. 81 in a game, 5 rings and a total obsession with winning. Forever.' },
  { name: 'Dwyane Wade', club: 'Heat', year: 2006, fame: 5, lo: 88, hi: 95, bioPt: 'Flash. Carregou o Heat ao anel de 2006 quase sozinho. Máquina de pôster.', bioEn: 'Flash. Dragged the Heat to the 2006 ring almost by himself. A poster machine.' },
  { name: 'James Harden', club: 'Rockets', year: 2018, fame: 4, lo: 86, hi: 93, bioPt: 'A barba, o step-back e o eurostep pra linha de lance. MVP de dar nó no marcador.', bioEn: 'The beard, the step-back and the euro to the line. An MVP who ties defenders in knots.' },
  { name: 'Ray Allen', club: 'Celtics', year: 2013, fame: 4, lo: 85, hi: 91, bioPt: 'A bola de 3 mais bonita da história — pergunta pros Spurs sobre 2013.', bioEn: 'The purest three-point stroke ever — ask the Spurs about 2013.' },
  { name: 'Vince Carter', club: 'Raptors', year: 2000, fame: 4, lo: 85, hi: 92, bioPt: 'Half Man, Half Amazing. Pulou POR CIMA de um pivô de 2,18m nas Olimpíadas.', bioEn: 'Half Man, Half Amazing. Jumped clean OVER a 7\'2" center at the Olympics.' },
  { name: 'Tracy McGrady', club: 'Magic', year: 2003, fame: 4, lo: 85, hi: 92, bioPt: '13 pontos em 33 segundos. Talento de anel com azar de playoffs.', bioEn: '13 points in 33 seconds. Ring-level talent with playoff-level bad luck.' },
  { name: 'Manu Ginóbili', club: 'Spurs', year: 2005, fame: 4, lo: 84, hi: 91, bioPt: 'Levou o eurostep pro mundo. Canhoto argentino que ganhava tudo saindo do banco.', bioEn: 'Brought the Eurostep to the world. An Argentine lefty who won it all off the bench.' },
  { name: 'Reggie Miller', club: 'Pacers', year: 1995, fame: 4, lo: 84, hi: 91, folk: true, bioPt: '8 pontos em 9 segundos e o sinal de "choke" pro Spike Lee. Vilão amado de Nova York.', bioEn: '8 points in 9 seconds and the choke sign to Spike Lee. New York\'s beloved villain.' },
  { name: 'Anthony Edwards', club: 'Wolves', year: 2024, fame: 3, lo: 79, hi: 88, promessa: true, bioPt: 'Sorriso, gargalhada e enterrada na sua cara. O futuro chegou e é divertido.', bioEn: 'Smile, laugh and a dunk in your face. The future is here and it\'s fun.' },
  { name: 'JR Smith', club: 'Cavaliers', year: 2018, fame: 2, lo: 66, hi: 82, folk: true, bioPt: 'Pegou o rebote na final de 2018 e... esqueceu o placar. Meme eterno.', bioEn: 'Grabbed the 2018 Finals rebound and... forgot the score. Eternal meme.' },
  // ── Lote 2 ──
  { name: 'Klay Thompson', club: 'Warriors', year: 2016, fame: 4, lo: 85, hi: 92, bioPt: 'Splash Brother nº2. 37 pontos num quarto só. Chega quieto e te afoga de 3.', bioEn: 'Splash Brother No.2. 37 points in a single quarter. Shows up quiet and drowns you in threes.' },
  { name: 'Nick Young (Swaggy P)', club: 'Lakers', year: 2014, fame: 2, lo: 64, hi: 82, folk: true, bioPt: 'Comemorou uma bola de 3 que NÃO entrou. O meme mais honesto da NBA.', bioEn: 'Celebrated a three that DIDN\'T go in. The most honest meme in the NBA.' },
  { name: 'Nate Robinson', club: 'Knicks', year: 2010, fame: 2, lo: 62, hi: 81, folk: true, bioPt: '1,75m e TRÊS títulos de enterrada. Pulou por cima do Yao no concurso. Depois levou nocaute no boxe 😅.', bioEn: 'Five-foot-nine and THREE dunk titles. Leapt over Yao in the contest. Later got knocked out boxing 😅.' },
  { name: 'Leandrinho', club: 'Suns', year: 2007, fame: 2, lo: 66, hi: 83, folk: true, bioPt: 'O Borrão Brasileiro. Sexto Homem do Ano, velocidade pura e anel em 2007. 🇧🇷', bioEn: 'The Brazilian Blur. Sixth Man of the Year, pure speed and a 2007 ring. 🇧🇷' },
  { name: 'Brian Scalabrine (White Mamba)', club: 'Celtics', year: 2008, fame: 1, lo: 52, hi: 72, folk: true, bioPt: 'O herói do banco. A torcida gritava o nome dele nos 2 minutos finais. Anel em 2008 sem suar.', bioEn: 'The bench hero. The crowd chanted his name in garbage time. A 2008 ring without breaking a sweat.' },
  { name: 'Adam Morrison', club: 'Lakers', year: 2008, fame: 1, lo: 50, hi: 70, folk: true, bioPt: 'Bigode, cabelão e DOIS anéis... aquecendo o banco. O bust mais estiloso da história.', bioEn: 'Mustache, long hair and TWO rings... warming the bench. The most stylish bust ever.' },
]

// ─── SF · ALA ────────────────────────────────────────────────────────
const SF: BC[] = [
  { name: 'LeBron James', club: 'Cavaliers', year: 2016, fame: 5, lo: 92, hi: 98, bioPt: 'O Rei. Trouxe o anel pra Cleveland com o bloqueio da vida. Um caminhão de talento.', bioEn: 'The King. Brought Cleveland a ring with The Block. A freight truck of talent.' },
  { name: 'Larry Bird', club: 'Celtics', year: 1986, fame: 5, lo: 91, hi: 97, bioPt: 'Trash-talk lendário e mão gelada do canto. Avisava o placar antes de acertar.', bioEn: 'Legendary trash talk and an ice-cold corner three. Called the shot before draining it.' },
  { name: 'Kevin Durant', club: 'Warriors', year: 2017, fame: 5, lo: 90, hi: 97, bioPt: '2,08m com mira de armador. Impossível de marcar, fácil de xingar no Twitter.', bioEn: 'Seven feet with a guard\'s touch. Impossible to guard, easy to roast on Twitter.' },
  { name: 'Kawhi Leonard', club: 'Raptors', year: 2019, fame: 4, lo: 87, hi: 93, bioPt: 'The Board Man. Mãos gigantes, cara de paisagem e a bola que quicou 4x contra o Philly.', bioEn: 'The Board Man. Giant hands, no expression and the four-bounce dagger over Philly.' },
  { name: 'Scottie Pippen', club: 'Bulls', year: 1994, fame: 4, lo: 85, hi: 91, bioPt: 'O melhor braço-direito da história. Defesa sufocante e o eterno "e se fosse titular?".', bioEn: 'The greatest sidekick ever. Suffocating defense and an eternal "what if he\'d led a team?".' },
  { name: 'Carmelo Anthony', club: 'Nuggets', year: 2013, fame: 4, lo: 84, hi: 91, bioPt: 'Melô. Jab step, subiu e converteu — o arremesso mais bonito da geração.', bioEn: 'Melo. Jab step, rise and bucket — the prettiest jumper of his generation.' },
  { name: 'Paul Pierce', club: 'Celtics', year: 2008, fame: 4, lo: 84, hi: 91, folk: true, bioPt: 'The Truth. Saiu de cadeira de rodas na final e voltou andando 🤔. Anel em 2008.', bioEn: 'The Truth. Left the Finals in a wheelchair and walked right back 🤔. Ring in 2008.' },
  { name: 'Jayson Tatum', club: 'Celtics', year: 2024, fame: 4, lo: 85, hi: 92, bioPt: 'Aluno do Kobe com anel em 2024. Sobe fácil e marca de todo jeito.', bioEn: 'Kobe\'s student with a 2024 ring. Rises easy and scores every which way.' },
  { name: 'Grant Hill', club: 'Pistons', year: 1997, fame: 3, lo: 80, hi: 88, bioPt: 'Era o "próximo Jordan" até o tornozelo trair. Elegância pura antes das lesões.', bioEn: 'Was the "next Jordan" until his ankle betrayed him. Pure elegance before the injuries.' },
  { name: 'Metta World Peace', club: 'Lakers', year: 2010, fame: 3, lo: 78, hi: 87, folk: true, bioPt: 'Agradeceu o psiquiatra na TV depois do anel. Defesa insana, mente livre.', bioEn: 'Thanked his psychiatrist on live TV after the ring. Insane defense, free mind.' },
  // ── Lote 2 ──
  { name: 'Anderson Varejão', club: 'Cavaliers', year: 2010, fame: 2, lo: 66, hi: 83, folk: true, bioPt: 'O cabelo, os flops teatrais e a energia infinita ao lado do LeBron. Xodó do Brasil na NBA. 🇧🇷', bioEn: 'The hair, the theatrical flops and endless energy next to LeBron. Brazil\'s NBA darling. 🇧🇷' },
  { name: 'Bruno Caboclo', club: 'Raptors', year: 2014, fame: 1, lo: 50, hi: 72, folk: true, bioPt: '"Está a dois anos de estar a dois anos de distância." A frase de scout que virou lenda. 🇧🇷', bioEn: '"Two years away from being two years away." The scouting line that became legend. 🇧🇷' },
  { name: 'Andrei Kirilenko (AK-47)', club: 'Jazz', year: 2004, fame: 3, lo: 80, hi: 88, bioPt: 'Russo que enchia a súmula: pontos, tocos, roubos, tudo. O canivete suíço do Jazz.', bioEn: 'A Russian who stuffed the box score: points, blocks, steals, everything. The Jazz\'s Swiss army knife.' },
  { name: 'Robert Horry (Big Shot Bob)', club: 'Lakers', year: 2002, fame: 3, lo: 76, hi: 86, folk: true, bioPt: 'Coadjuvante com SETE anéis. Sumia o jogo todo e acertava a bola que ganhava a série.', bioEn: 'A role player with SEVEN rings. Vanished all game then hit the shot that won the series.' },
]

// ─── PF · ALA-PIVÔ ───────────────────────────────────────────────────
const PF: BC[] = [
  { name: 'Tim Duncan', club: 'Spurs', year: 2003, fame: 5, lo: 91, hi: 97, bioPt: 'O Big Fundamental. Bola na tabela, cara de tédio e 5 anéis. Chato de tão bom.', bioEn: 'The Big Fundamental. Bank shot, bored face and 5 rings. So good it\'s boring.' },
  { name: 'Dirk Nowitzki', club: 'Mavericks', year: 2011, fame: 5, lo: 90, hi: 96, bioPt: 'O arremesso numa perna só, impossível de bloquear. O alemão que humilhou o Heat.', bioEn: 'The one-legged fadeaway, impossible to block. The German who humbled the Heat.' },
  { name: 'Giannis Antetokounmpo', club: 'Bucks', year: 2021, fame: 5, lo: 90, hi: 96, bioPt: 'Greek Freak. Do nada pra MVP e anel. Atravessa a quadra toda em 3 passos.', bioEn: 'Greek Freak. From nowhere to MVP and a ring. Crosses the whole floor in three steps.' },
  { name: 'Charles Barkley', club: 'Suns', year: 1993, fame: 4, lo: 86, hi: 93, bioPt: 'Round Mound of Rebound. 1,98m brigando com pivôs — e ganhando. MVP e boca solta.', bioEn: 'Round Mound of Rebound. 6\'6" fighting centers — and winning. MVP and loose lips.' },
  { name: 'Kevin Garnett', club: 'Timberwolves', year: 2004, fame: 4, lo: 86, hi: 92, bioPt: '"ANYTHING IS POSSIBLE!" Intensidade beirando a loucura e defesa que engolia todo mundo.', bioEn: '"ANYTHING IS POSSIBLE!" Intensity bordering on madness and defense that swallowed everyone.' },
  { name: 'Karl Malone', club: 'Jazz', year: 1997, fame: 4, lo: 86, hi: 92, bioPt: 'The Mailman — sempre entregava. Pick-and-roll eterno com o Stockton, só faltou o anel.', bioEn: 'The Mailman — always delivered. Eternal pick-and-roll with Stockton, just missing the ring.' },
  { name: 'Anthony Davis', club: 'Lakers', year: 2020, fame: 4, lo: 86, hi: 92, bioPt: 'The Brow. Toca o teto do garrafão, tapa tudo e a monocelha vira marca registrada.', bioEn: 'The Brow. Touches the top of the paint, blocks everything, unibrow and all.' },
  { name: 'Pau Gasol', club: 'Lakers', year: 2010, fame: 4, lo: 84, hi: 90, bioPt: 'Espanhol de mão macia — parceiro de anel do Kobe. Passe de pivô, técnica de armador.', bioEn: 'A soft-handed Spaniard — Kobe\'s ring partner. Big-man passing, guard\'s touch.' },
  { name: 'Zion Williamson', club: 'Pelicans', year: 2023, fame: 3, lo: 79, hi: 88, promessa: true, bioPt: '129 quilos que voam. A força da natureza que faz o aro tremer.', bioEn: '285 pounds that fly. A force of nature that makes the rim shake.' },
  { name: 'Dennis Rodman', club: 'Bulls', year: 1996, fame: 4, lo: 82, hi: 90, folk: true, bioPt: 'The Worm. Cabelo colorido, rebote insano e vestido de noiva no lançamento do livro.', bioEn: 'The Worm. Rainbow hair, insane rebounding and a wedding dress at his book launch.' },
  // ── Lote 2 ──
  { name: 'Draymond Green', club: 'Warriors', year: 2017, fame: 4, lo: 82, hi: 89, folk: true, bioPt: 'O cérebro e o barraco dos Warriors. Marca as 5 posições e distribui chute e soco.', bioEn: 'The brain and the drama of the Warriors. Guards all five spots and hands out kicks and punches.' },
  { name: 'Blake Griffin', club: 'Clippers', year: 2014, fame: 4, lo: 84, hi: 90, bioPt: 'Lob City. Enterrou POR CIMA de um carro no concurso. Pôster ambulante da geração.', bioEn: 'Lob City. Dunked OVER a car in the contest. The walking poster of his generation.' },
  { name: 'Kwame Brown', club: 'Wizards', year: 2003, fame: 1, lo: 50, hi: 70, folk: true, bioPt: '1ª escolha geral que o Jordan escolheu... e se arrependeu. O bust nº1 do manual.', bioEn: 'A No.1 overall pick Jordan himself chose... and regretted. The textbook bust.' },
  { name: 'Darko Miličić', club: 'Pistons', year: 2004, fame: 1, lo: 52, hi: 72, folk: true, bioPt: 'Escolhido na FRENTE de Melô, Wade E Bosh. O "e se?" mais caro da NBA.', bioEn: 'Drafted AHEAD of Melo, Wade AND Bosh. The most expensive "what if?" in the NBA.' },
  { name: 'Tiago Splitter', club: 'Spurs', year: 2014, fame: 2, lo: 70, hi: 84, folk: true, bioPt: 'Pivô brasileiro dos Spurs campeões de 2014. Sólido, discreto e com anel no dedo. 🇧🇷', bioEn: 'A Brazilian big on the 2014 champion Spurs. Solid, quiet and with a ring on his finger. 🇧🇷' },
]

// ─── C · PIVÔ ────────────────────────────────────────────────────────
const C: BC[] = [
  { name: "Shaquille O'Neal", club: 'Lakers', year: 2000, fame: 5, lo: 92, hi: 98, bioPt: 'The Diesel. Quebrava tabela e tanque de guerra. Imparável por dentro, péssimo no lance livre.', bioEn: 'The Diesel. Broke backboards and tanks. Unstoppable inside, hopeless at the line.' },
  { name: 'Kareem Abdul-Jabbar', club: 'Lakers', year: 1980, fame: 5, lo: 92, hi: 98, bioPt: 'O gancho-céu que ninguém nunca bloqueou. Maior pontuador da liga por 39 anos.', bioEn: 'The sky-hook nobody ever blocked. All-time scoring king for 39 years.' },
  { name: 'Hakeem Olajuwon', club: 'Rockets', year: 1994, fame: 5, lo: 91, hi: 97, bioPt: 'The Dream. O Dream Shake deixava pivôs no chão. Bicampeão e xerife da área.', bioEn: 'The Dream. A Dream Shake that left centers on the floor. Two rings and paint sheriff.' },
  { name: 'Nikola Jokić', club: 'Nuggets', year: 2023, fame: 5, lo: 90, hi: 96, bioPt: 'The Joker. Parece que nem corre, mas é MVP e passa como armador de 2,11m.', bioEn: 'The Joker. Looks like he never runs, yet he\'s an MVP passing like a 6\'11" point guard.' },
  { name: 'Wilt Chamberlain', club: 'Warriors', year: 1962, fame: 5, lo: 90, hi: 97, bioPt: '100 pontos NUM jogo. 50 de média numa temporada. Números de videogame com bug.', bioEn: '100 points in ONE game. 50 a night for a season. Glitched-videogame numbers.' },
  { name: 'Bill Russell', club: 'Celtics', year: 1965, fame: 5, lo: 89, hi: 96, bioPt: '11 anéis. ONZE. Ganhou mais que qualquer um e nunca deixou esquecer a defesa.', bioEn: '11 rings. ELEVEN. Won more than anyone and never let you forget the defense.' },
  { name: 'David Robinson', club: 'Spurs', year: 1995, fame: 4, lo: 87, hi: 93, bioPt: 'The Admiral. Militar, MVP e tampão. Passou o bastão pro Duncan e faturou os anéis.', bioEn: 'The Admiral. Navy man, MVP and shot-blocker. Passed the torch to Duncan and got his rings.' },
  { name: 'Patrick Ewing', club: 'Knicks', year: 1994, fame: 4, lo: 85, hi: 92, bioPt: 'O suadão que carregou Nova York nas costas. Faltou só o anel — culpa do Jordan.', bioEn: 'The sweaty giant who carried New York. Just missing a ring — blame Jordan.' },
  { name: 'Yao Ming', club: 'Rockets', year: 2007, fame: 4, lo: 84, hi: 91, bioPt: '2,29m que abriram a NBA pra China inteira. Gigante gentil com toque macio.', bioEn: 'Seven-foot-six that opened the NBA to all of China. A gentle giant with a soft touch.' },
  { name: 'Dikembe Mutombo', club: 'Nuggets', year: 1995, fame: 3, lo: 80, hi: 88, folk: true, bioPt: 'Não. NÃO. O dedo mais famoso da NBA depois de cada toco no adversário.', bioEn: 'No. NO. The most famous finger wag in the NBA after every block.' },
  { name: 'Victor Wembanyama', club: 'Spurs', year: 2024, fame: 3, lo: 80, hi: 90, promessa: true, bioPt: 'O alienígena. 2,24m que enterra, crava toco e acerta de três. O futuro chegou cedo.', bioEn: 'The alien. 7-foot-4 that dunks, swats and drains threes. The future came early.' },
  { name: 'Boban Marjanović', club: 'Clippers', year: 2019, fame: 1, lo: 58, hi: 78, folk: true, bioPt: 'Mãos do tamanho da sua cara. Faz a bola de basquete parecer bolinha de tênis.', bioEn: 'Hands the size of your face. Makes a basketball look like a tennis ball.' },
  // ── Lote 2 ──
  { name: 'Nenê', club: 'Nuggets', year: 2011, fame: 3, lo: 78, hi: 86, folk: true, bioPt: 'O primeiro brasileiro escolhido no top 10 do draft. Força, técnica e 18 anos de NBA. 🇧🇷', bioEn: 'The first Brazilian picked in the draft top 10. Strength, skill and 18 NBA seasons. 🇧🇷' },
  { name: 'Rudy Gobert', club: 'Jazz', year: 2021, fame: 3, lo: 80, hi: 88, folk: true, bioPt: 'Melhor defensor 4x. Ficou famoso por tocar TODOS os microfones bem no começo da pandemia 😷.', bioEn: '4x Defensive Player of the Year. Got famous for touching EVERY mic right as the pandemic hit 😷.' },
  { name: 'DeAndre Jordan', club: 'Clippers', year: 2015, fame: 3, lo: 78, hi: 86, bioPt: 'Lob City no ar, pesadelo no lance livre. Rei do alley-oop do Chris Paul.', bioEn: 'Lob City in the air, a nightmare at the line. King of the Chris Paul alley-oop.' },
  { name: 'Bill Laimbeer', club: 'Pistons', year: 1990, fame: 3, lo: 76, hi: 85, folk: true, bioPt: 'O vilão dos Bad Boys que todo mundo adorava odiar. Cotovelada com sorriso. Bicampeão.', bioEn: 'The Bad Boys villain everyone loved to hate. An elbow with a smile. Two-time champ.' },
  { name: 'Manute Bol', club: 'Bullets', year: 1986, fame: 1, lo: 54, hi: 74, folk: true, bioPt: '2,31m, o mais alto da história. Tocava tudo e ainda arriscava bola de 3. Folclore vivo.', bioEn: 'Seven-foot-seven, the tallest ever. Blocked everything and still chucked threes. Living folklore.' },
  { name: 'Shawn Bradley', club: 'Mavericks', year: 1998, fame: 1, lo: 54, hi: 74, folk: true, bioPt: '2,29m que virou o pôster favorito de todo mundo — levou enterrada de meio mundo.', bioEn: 'Seven-foot-six who became everyone\'s favorite poster — got dunked on by half the league.' },
  { name: 'Greg Oden', club: 'Blazers', year: 2009, fame: 1, lo: 56, hi: 78, folk: true, bioPt: 'Escolhido na frente do Durant. Os joelhos roubaram a carreira antes de começar. O maior "e se?".', bioEn: 'Picked ahead of Durant. His knees stole the career before it began. The great "what if?".' },
]

// catálogo por posição — mesma forma do futebol (Record<posição, cartas[]>)
export const CATALOG_NBA: Record<BPos, BC[]> = { PG, SG, SF, PF, C }

// conjunto de nomes que são PROMESSA (pro tier 💎) — igual ao PROMESSA_SET do futebol
export const PROMESSA_SET_NBA = new Set(
  Object.values(CATALOG_NBA).flat().filter(c => c.promessa).map(c => c.name),
)

// total colecionável do Lote 1 (cada nome|franquia|ano conta uma vez)
export const NBA_TOTAL = new Set(
  Object.values(CATALOG_NBA).flat().map(c => `${c.name}|${c.club}|${c.year}`),
).size
