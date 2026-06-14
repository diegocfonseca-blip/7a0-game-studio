export interface MatchMoment {
  minute: number
  type: 'buildup' | 'goal' | 'save' | 'miss' | 'danger' | 'tactical' | 'conceded'
  forUs: boolean
  playerName?: string
  lines: string[]
  isGoal: boolean
}

// ─── RNG ─────────────────────────────────────────────────────────────────────

function hashR(seed: string, matchIdx: number, offset: number): number {
  let h = 0
  const str = `${seed}|${matchIdx}|${offset}`
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0
  return (h >>> 0) / 4294967296
}

function seededShuffle<T>(arr: T[], seed: string, matchIdx: number, cat: number): T[] {
  const r = [...arr]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(hashR(seed, matchIdx, cat * 1000 + i) * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

// ─── Paired plays (buildup + goal sempre coerentes) ───────────────────────────

type GoalPlay = {
  positions: string[]
  buildup: (p: string) => string[]
  goal:    (p: string) => string[]
}

const GOAL_PLAYS: GoalPlay[] = [
  // ── Ponta / winger ───────────────────────────────────────────────────────
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} recebe na ponta, elimina o lateral com um corte seco e invade a área!`],
    goal:    p => [`GOOOOOL! ${p} bateu cruzado na saída do goleiro!`, `Velocidade, frieza e categoria. Impossível de parar!`],
  },
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} corta para dentro pelo lado direito, o pé esquerdo armado...`],
    goal:    p => [`${p} COLOCOU NO ÂNGULO! QUE GOL!`, `A bola ainda chiou quando passou pelo goleiro. Que primor!`],
  },
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} recebe na esquerda, dribla um, dribla dois, o terceiro cai no chão...`],
    goal:    p => [`QUE GOLAÇO DE ${p.toUpperCase()}! DOMINOU, DRIBLOU, FUSILOU!`, `Futebol arte puro! A torcida vai à loucura!`],
  },
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} arranca em velocidade pela ponta, a defesa não consegue acompanhar!`],
    goal:    p => [`${p.toUpperCase()} ENTRA NA ÁREA E CHUTA! GOOOOL!`, `Rápido demais para qualquer marcação. Imparável!`],
  },
  {
    positions: ['PD', 'PE', 'MD', 'ME'],
    buildup: p => [`${p} para a bola no peito, um toque só para ajustar e...`],
    goal:    p => [`QUE BELEZA! ${p} bateu de primeira e explodiu nas redes!`, `Um toque de mestre. O goleiro estava no lugar certo mas não teve chance.`],
  },
  {
    positions: ['PD', 'PE'],
    buildup: p => [`Lançamento nas costas da defesa! ${p} vai em velocidade e chega na bola antes do goleiro!`],
    goal:    p => [`${p.toUpperCase()} TOCOU PARA O GOL VAZIO! GOOOOOL!`, `Puro timing de atacante. Antecipou tudo!`],
  },

  // ── Centroavante / segunda atacante ──────────────────────────────────────
  {
    positions: ['CA'],
    buildup: p => [`Cruzamento preciso vindo da direita! ${p} chega na segunda trave...`],
    goal:    p => [`GOOOOOL! ${p} EMPURRA PARA O FUNDO DAS REDES!`, `Oportunismo de centroavante puro. No lugar certo, na hora certa!`],
  },
  {
    positions: ['CA'],
    buildup: p => [`${p} recebe de costas para o gol, sente a marcação, gira rápido...`],
    goal:    p => [`${p} MARCA! Giro e chute num só movimento impecável!`, `O goleiro mal viu a bola passar. QUE FINALIZAÇÃO!`],
  },
  {
    positions: ['CA'],
    buildup: p => [`Passe em profundidade nas costas da defesa! ${p} está isolado em posição de gol!`],
    goal:    p => [`GOOOOOL! ${p} dominou no peito e tocou na saída do goleiro!`, `Instinto de artilheiro. Que precisão absurda!`],
  },
  {
    positions: ['CA', 'PD', 'PE'],
    buildup: p => [`Rebote dentro da área! ${p} estava pronto para a segunda bola...`],
    goal:    p => [`${p} NÃO PERDOA! Rebote e gol! Oportunismo absoluto!`, `Estava ali para isso. Artilheiro nato!`],
  },
  {
    positions: ['CA'],
    buildup: p => [`${p} está de frente para o goleiro, um contra um... o estádio prende a respiração!`],
    goal:    p => [`FRIO COMO GELO! ${p} bateu no cantinho e fez o goleiro se enganar!`, `Nervos de aço. Que frieza nos pés do centroavante!`],
  },
  {
    positions: ['CA', 'MEI'],
    buildup: p => [`Tabelinha rápida na área! ${p} recebe na soltura, completamente livre!`],
    goal:    p => [`${p.toUpperCase()} CONCLUIU! GOL DE PRIMEIRA!`, `Dois toques para a jogada, um para o gol. Simplicidade genial!`],
  },
  {
    positions: ['CA'],
    buildup: p => [`A bola sobrou na área para ${p} — sem zagueiro por perto, cara a cara!`],
    goal:    p => [`GOOOOL! ${p} não hesitou por uma fração de segundo!`, `Isso é o que separa os grandes artilheiros dos demais.`],
  },

  // ── Meia-atacante / armador ───────────────────────────────────────────────
  {
    positions: ['MEI', 'MC', 'VOL'],
    buildup: p => [`${p} recebe de frente para o gol na entrada da área, abre o pé...`],
    goal:    p => [`QUE GOLAÇO DE ${p.toUpperCase()}! Chute colocado no ângulo superior!`, `De fora da área! O goleiro não teve tempo de reagir. Magistral!`],
  },
  {
    positions: ['MEI', 'MC', 'VOL'],
    buildup: p => [`${p} carrega da intermediária com confiança, abre um drible, abre espaço...`],
    goal:    p => [`${p.toUpperCase()} MARCA DE FORA DA ÁREA! BOMBA!`, `A bola explodiu no ângulo. O goleiro só olhou. Impossível defender!`],
  },
  {
    positions: ['MEI', 'MC'],
    buildup: p => [`Triangulação rápida no meio! ${p} surge na área completamente sozinho!`],
    goal:    p => [`GOL! ${p} recebeu livre e tocou com a categoria de sempre!`, `Jogada de tabela perfeita. Que inteligência coletiva!`],
  },
  {
    positions: ['MEI', 'MC'],
    buildup: p => [`${p} pega a bola no meio, levanta a cabeça, ninguém para ele...`],
    goal:    p => [`${p.toUpperCase()} CHEGOU CARREGANDO E BATEU! GOOOOOL!`, `Quando ele tem espaço assim, não tem defesa no mundo que segure!`],
  },
  {
    positions: ['MEI'],
    buildup: p => [`${p} conduziu da esquerda para o centro, olhou, ajustou o corpo...`],
    goal:    p => [`${p} DEU UMA OLHADA E MANDOU NO ÂNGULO! QUE GOL!`, `Inteligência e técnica num único movimento. Isso é para poucos!`],
  },

  // ── Zagueiro / lateral (gol em bola parada) ──────────────────────────────
  {
    positions: ['ZAG', 'LD', 'LE'],
    buildup: p => [`Escanteio batido! ${p} sobe como poste na segunda trave!`],
    goal:    p => [`GOL DE CABEÇA DE ${p.toUpperCase()}! O DEFENSOR FOI AO ATAQUE!`, `Ninguém marcou ${p}! Completamente livre para cabecear no ângulo!`],
  },
  {
    positions: ['ZAG', 'LD', 'LE'],
    buildup: p => [`Falta cobrada na área! ${p} está no grupo com os atacantes!`],
    goal:    p => [`${p.toUpperCase()} CABECEOU! GOL DO DEFENSOR! INACREDITÁVEL!`, `O lateral foi ao ataque no momento exato. Que surpresa!`],
  },
  {
    positions: ['ZAG', 'LD', 'LE'],
    buildup: p => [`${p} foi ao ataque no escanteio. Toda a equipe na área...`],
    goal:    p => [`${p.toUpperCase()} SUBIU MAIS ALTO E CABECEOU! GOL!`, `O zagueiro mais alto que todos. Cabeçada de mão cheia!`],
  },

  // ── Contra-ataque ─────────────────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`Roubo de bola no meio-campo! ${p} sai em disparada no contra-ataque!`],
    goal:    p => [`CONTRA-ATAQUE LETAL! ${p} chegou na cara do goleiro e não perdoou!`, `Velocidade mortal. GOL!`],
  },
  {
    positions: [],
    buildup: p => [`Dois contra um no contra-ataque! ${p} recebe a bola em frente ao gol!`],
    goal:    p => [`${p} bateu cruzado! GOL NO CONTRA-ATAQUE!`, `Três toques da recuperação ao fundo da rede. Perfeito!`],
  },
  {
    positions: [],
    buildup: p => [`Transição ultrarrápida! ${p} está isolado com a bola em velocidade!`],
    goal:    p => [`${p} MARCA! GOOOOL NO CONTRA-ATAQUE!`, `O adversário não voltou a tempo. Punição máxima!`],
  },
  {
    positions: [],
    buildup: p => [`Interceptação genial! ${p} sai sozinho, apenas o goleiro pela frente...`],
    goal:    p => [`${p} DEFINIU COM CATEGORIA! GOOOOL!`, `Saiu do roubo ao gol em seis segundos. Fulminante!`],
  },
  {
    positions: ['PD', 'PE', 'CA'],
    buildup: p => [`A defesa perdeu a bola no campo de ataque! ${p} saiu em velocidade!`],
    goal:    p => [`ATAQUE RELÂMPAGO! ${p} MARCOU! GOOOOOL!`, `Do erro da defesa adversária ao gol em três passes. Letal!`],
  },

  // ── Pênalti ──────────────────────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`PÊNALTI MARCADO! A arbitragem apontou para a marca! ${p} vai cobrar...`],
    goal:    p => [`PÊNALTI CONVERTIDO! ${p} bateu forte no canto direito!`, `O goleiro foi para o lado errado. GOOOOOL!`],
  },
  {
    positions: [],
    buildup: p => [`PÊNALTI! Falta dentro da área! ${p} pega a bola e se prepara...`],
    goal:    p => [`${p} FEZ A PARADINHA e enganou o goleiro! GOOOOOL!`, `O arqueiro se jogou cedo. ${p} colocou no cantinho com perfeição.`],
  },
  {
    positions: [],
    buildup: p => [`PÊNALTI ASSINALADO! O estádio para. ${p} coloca a bola na marca...`],
    goal:    p => [`PÊNALTI CONVERTIDO! ${p} bate rasteiro no canto esquerdo!`, `Frieza absoluta. O goleiro mal se mexeu. Puro sangue frio!`],
  },
  {
    positions: [],
    buildup: p => [`PÊNALTI! ${p} pega a bola, olha para o gol, dá três passos...`],
    goal:    p => [`${p} CARREGOU COM TUDO! GOL! A bola rasgou as redes!`, `Potência e precisão. O goleiro não teve a menor chance.`],
  },

  // ── Falta direta ─────────────────────────────────────────────────────────
  {
    positions: ['MEI', 'MC', 'PE', 'PD', 'CA'],
    buildup: p => [`Falta perigosa na entrada da área! ${p} é especialista em bola parada...`],
    goal:    p => [`GOL DE FALTA DIRETA DE ${p.toUpperCase()}!`, `A bola foi por cima da barreira e explodiu no ângulo! Que primor!`],
  },
  {
    positions: [],
    buildup: p => [`Falta na entrada da área. ${p} vai cobrar diretamente ao gol!`],
    goal:    p => [`QUE GOLAÇO DE FALTA! ${p} cobrou com efeito e a bola entrou no ângulo!`, `O goleiro estava bem posicionado mas a bola mudou de trajetória. Absurdo!`],
  },
  {
    positions: ['MEI', 'MC'],
    buildup: p => [`Falta perigosíssima! ${p} coloca a bola, ajusta a distância, pede silêncio...`],
    goal:    p => [`${p.toUpperCase()} COBROU E MARCOU! QUE FALTA!`, `A bola passou pela barreira por baixo e rasteiro. O goleiro foi enganado!`],
  },

  // ── Chute de longe ───────────────────────────────────────────────────────
  {
    positions: ['MEI', 'MC', 'VOL', 'ZAG'],
    buildup: p => [`${p} carrega da intermediária, abre espaço e decide arriscar de longe!`],
    goal:    p => [`${p} ARRISCA DE LONGE... GOLAÇO!`, `A bola entrou no ângulo antes que o goleiro fosse para o canto!`],
  },
  {
    positions: [],
    buildup: p => [`${p} recebe de frente para o gol a 25 metros e decide chutar!`],
    goal:    p => [`${p} bateu forte e a bola foi para o ângulo superior! GOL SENSACIONAL!`, `Que potência! O goleiro sequer se mexeu.`],
  },
  {
    positions: ['ZAG', 'VOL', 'MC'],
    buildup: p => [`${p} com espaço na intermediária! Levantou a cabeça... resolveu arriscar!`],
    goal:    p => [`CHUTAÇO DE ${p.toUpperCase()}! GOL DO MEIO-CAMPO QUASE!`, `A bola desceu debaixo do travessão. O goleiro viu passar pelo ângulo!`],
  },
  {
    positions: [],
    buildup: p => [`A bola sobrou para ${p} na entrada da área. Todo mundo esperava o passe...`],
    goal:    p => [`${p} RESOLVEU SOZINHO! CHUTOU E MARCOU!`, `Surprendeu a todos — inclusive o goleiro! Que leitura de jogo!`],
  },

  // ── Cabeçada de cruzamento ───────────────────────────────────────────────
  {
    positions: ['CA', 'PD', 'PE', 'ZAG'],
    buildup: p => [`Cruzamento preciso vindo da esquerda! ${p} aparece no primeiro pau!`],
    goal:    p => [`GOL DE CABEÇA DE ${p.toUpperCase()}!`, `Cruzamento perfeito, ${p} subiu mais alto que todo mundo. No ângulo!`],
  },
  {
    positions: ['CA', 'ZAG', 'LD'],
    buildup: p => [`Bola alçada na área! ${p} disputa pelo alto!`],
    goal:    p => [`${p.toUpperCase()} CABECEOU! GOOOOL!`, `A cabeçada foi no ângulo inferior. Goleiro batido sem chance!`],
  },
  {
    positions: ['CA', 'PE', 'PD'],
    buildup: p => [`Cruzamento rasteiro na área! ${p} aparece no segundo pau para completar!`],
    goal:    p => [`${p} COMPLETA DE CABEÇA! GOOOOL!`, `Estava só precisando aparecer. Cabeçada certeira!`],
  },
  {
    positions: ['CA', 'MEI'],
    buildup: p => [`Bola colocada na área com perfeição! ${p} se antecipa ao zagueiro...`],
    goal:    p => [`${p.toUpperCase()} ANTECIPOU E CABECEOU! GOL!`, `Mais rápido que o marcador. Instinto de goleador!`],
  },

  // ── Cavadinha / individual ───────────────────────────────────────────────
  {
    positions: ['CA', 'MEI', 'PD', 'PE'],
    buildup: p => [`${p} está um contra um com o goleiro! O arqueiro adiantou demais!`],
    goal:    p => [`QUE CATEGORIA! ${p} encobriu o goleiro com uma cavadinha sublime!`, `O arqueiro foi ao chão e viu a bola passar por cima. GOOOOL!`],
  },
  {
    positions: ['CA', 'MEI'],
    buildup: p => [`${p} pegou a bola na área, finalizou por cima do goleiro que havia saído!`],
    goal:    p => [`TOCOU POR CIMA! QUE JOGADA DE ${p.toUpperCase()}!`, `Delicadeza absoluta num momento de pressão. Arte pura!`],
  },

  // ── Voleio ───────────────────────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`A bola veio pelo ar na área! ${p} preparou o voleio...`],
    goal:    p => [`VOLEIO DE ${p.toUpperCase()}! QUE FORMA DE MARCAR!`, `A bola ainda estava no ar quando ${p} bateu de primeira. Espetacular!`],
  },
  {
    positions: ['CA', 'PE', 'PD'],
    buildup: p => [`Cruzamento alto! ${p} não deixou a bola cair...`],
    goal:    p => [`DE VOLEIO! ${p.toUpperCase()} BATEU DE PRIMEIRA! GOLAÇO!`, `Que coordenação motora absurda! Isso não foi futebol, foi arte!`],
  },

  // ── Bicicleta ────────────────────────────────────────────────────────────
  {
    positions: ['CA', 'PE', 'PD'],
    buildup: p => [`A bola veio alta na área, ${p} está de costas para o gol...`],
    goal:    p => [`BICICLETA DE ${p.toUpperCase()}! QUE GOLAÇO HISTÓRICO!`, `O estádio explodiu! Até os torcedores adversários aplaudiram de pé!`],
  },

  // ── Deflexão / erro da defesa ─────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`Chute de ${p} forte e cruzado! Desviou no zagueiro adversário!`],
    goal:    p => [`GOL! O desvio enganou o goleiro! ${p} leva o crédito!`, `A deflexão mudou a trajetória. Nada a fazer para o goleiro.`],
  },
  {
    positions: [],
    buildup: p => [`${p} bateu de primeira na área! A bola desviou na zaga...`],
    goal:    p => [`GOL CONTRA! A defesa adversária mandou para as próprias redes!`, `${p} deu o trabalho, a defesa fez o resto. Cruel o futebol!`],
  },

  // ── Saída errada do goleiro ───────────────────────────────────────────────
  {
    positions: ['CA', 'PE', 'PD'],
    buildup: p => [`O goleiro saiu mal do gol! ${p} percebeu e tentou por cima...`],
    goal:    p => [`${p} TOCOU PARA O GOL VAZIO! GOOOOOL!`, `O goleiro se arrependeu de ter saído. Aproveitado com maestria!`],
  },

  // ── Jogada coletiva ───────────────────────────────────────────────────────
  {
    positions: [],
    buildup: p => [`Troca de passes rápida no meio! ${p} aparece em profundidade...`],
    goal:    p => [`GOL! Que combinação linda! ${p} concluiu com categoria!`, `Cinco toques do meio até o fundo da rede. Futebol total!`],
  },
  {
    positions: ['CA', 'MEI', 'PE', 'PD'],
    buildup: p => [`Jogada ensaiada! Tabelinha de primeira no terço final, ${p} chegou livre!`],
    goal:    p => [`${p.toUpperCase()} FINALIZOU DE PRIMEIRA! GOOOOOL!`, `Combinação perfeita. Sem dar chance para a defesa se organizar!`],
  },

  // ── Gol aos acréscimos / dramático ───────────────────────────────────────
  {
    positions: [],
    buildup: p => [`Último ataque do jogo! ${p} recebe a bola no lado direito da área!`],
    goal:    p => [`${p.toUpperCase()} MARCOOOOU! NOS ÚLTIMOS SEGUNDOS!`, `A torcida foi ao delírio absoluto! Um gol que ficará na memória!`],
  },
]

// ─── Missas chances (buildup + resultado frustrado) ───────────────────────────

type MissedPlay = {
  buildup: (p: string) => string[]
  save: string[]
}

const MISSED_PLAYS: MissedPlay[] = [
  {
    buildup: p => [`${p} avança pelo meio, livra-se da marcação e chuta forte...`],
    save: [`O goleiro voa para defender no canto! Que defesa fantástica!`, `Nossa equipe precisa insistir!`],
  },
  {
    buildup: p => [`${p} recebe passe em profundidade e chuta de primeira!`],
    save: [`NA TRAVE! A bola bateu no poste e saiu! Que azar!`, `O goleiro respirou aliviado.`],
  },
  {
    buildup: p => [`${p} tenta a jogada individual, dribla e arma o chute!`],
    save: [`Defesa espetacular! O goleiro espalmou no último momento!`, `Incrível o reflexo desse arqueiro.`],
  },
  {
    buildup: p => [`${p} recebe pela direita, corta para dentro e arma o chute!`],
    save: [`PARA FORA! A bola passou raspando a trave direita!`, `Tão perto... e tão longe.`],
  },
  {
    buildup: p => [`Bola alçada na área! ${p} sobe para cabecear!`],
    save: [`O zagueiro bloqueou em cima da linha! Que alívio para o adversário!`, `Nossa equipe fica com raiva de tanto azar.`],
  },
  {
    buildup: p => [`${p} entra na área e chuta a queima-roupa!`],
    save: [`O goleiro saiu bem do gol e fechou o ângulo!`, `Intervenção cirúrgica do goleiro.`],
  },
  {
    buildup: p => [`Cruzamento para a área! ${p} vai cabecear!`],
    save: [`A bola foi para fora pela linha de fundo. Escanteio.`],
  },
  {
    buildup: p => [`${p} carrega da intermediária e resolve arriscar!`],
    save: [`NO TRAVESSÃO! A bola saiu por cima!`, `O goleiro já estava batido.`],
  },
  {
    buildup: p => [`${p} aparece livre na área após lançamento!`],
    save: [`O goleiro se atirou e defendeu com o pé! Que reflexo!`, `Às vezes a sorte está do lado errado.`],
  },
  {
    buildup: p => [`${p} recebe de costas para o gol, gira e chuta!`],
    save: [`PARA FORA! A finalização passou alto!`, `O atacante ficou com a cabeça nas mãos.`],
  },
  {
    buildup: p => [`Contra-ataque! ${p} sai em velocidade com bola dominada!`],
    save: [`NO POSTE! A bola bateu no poste esquerdo e voltou!`, `A trave foi o melhor goleiro do adversário nesse momento.`],
  },
  {
    buildup: p => [`${p} recebe na entrada da área e chuta de primeira!`],
    save: [`O goleiro mergulhou no canto e chegou na bola com as pontas dos dedos!`, `Defesa absolutamente incrível!`],
  },
  {
    buildup: p => [`${p} avança em velocidade e fica cara a cara com o goleiro!`],
    save: [`O goleiro foi ao chão e bloqueou com o corpo! Valente o arqueiro!`, `Parou sozinho o cara a cara. Herói do adversário por agora.`],
  },
  {
    buildup: p => [`${p} recebeu passe de calcanhar dentro da área e finalizou!`],
    save: [`ESPALMOU! Que defesa reflexiva do goleiro!`, `A bola ia no ângulo. O goleiro salvou com a ponta dos dedos.`],
  },
  {
    buildup: p => [`Tabelinha dentro da área! ${p} ficou livre para o chute!`],
    save: [`O zagueiro se jogou na frente na última fração de segundo!`, `Sacrifício total do defensor. Bloqueou com o corpo!`],
  },
  {
    buildup: p => [`${p} chuta colocado da entrada da área...`],
    save: [`NA TRAVE! A bola bateu no poste e o goleiro pegou o rebote!`, `A trave esteve do lado do adversário.`],
  },
  {
    buildup: p => [`${p} recebeu sozinho no coração da área...`],
    save: [`Chutou para fora! Pressão demais. Ou falta de concentração?`, `Estava livre demais. Às vezes é mais difícil assim.`],
  },
  {
    buildup: p => [`Escanteio cobrado, ${p} subiu de costas e cabeceou!`],
    save: [`A cabeçada foi no travessão! Que azar descomunal!`, `A bola ainda vibrou no cano antes de sair.`],
  },
]

// ─── Perigos do adversário ────────────────────────────────────────────────────

const DANGERS: string[][] = [
  [`O adversário avança pelo lado esquerdo e levanta na área...`, `A defesa corta no sufoco!`],
  [`Pressão intensa! Bola na área, situação muito perigosa...`, `O zagueiro afasta de cabeça no último momento!`],
  [`Contra-ataque adversário perigoso! Três contra dois...`, `O lateral recupera e evita o perigo!`],
  [`Falta perigosa na entrada da nossa área...`, `A barreira fez o seu trabalho!`],
  [`Cruzamento na área! O atacante adversário tentou!`, `O goleiro pegou firme com as duas mãos!`],
  [`Chute de longe do adversário!`, `A bola foi direto para as mãos do nosso goleiro.`],
  [`Pressão máxima! O adversário cerca a área e exige atenção total...`, `A defesa segura firme e afasta!`],
  [`Chute rasteiro do adversário na área pequena...`, `O goleiro cai e defende no canto!`],
  [`Escanteio adversário perigoso! O zagueiro pula junto e...`, `Cabeceou para fora! Que alívio!`],
  [`Contra-ataque rápido do oponente! Dois a um na corrida...`, `O lateral correndo consegue interceptar!`],
  [`Bola nas costas da nossa defesa! O atacante estava em posição suspeita...`, `A bandeira sobe! Impedimento!`],
  [`O adversário chega pela esquerda, corta e bate forte...`, `A bola passou alto, por cima do travessão!`],
  [`Lançamento longo do adversário! Nosso goleiro sai do gol e...`, `Corta no ar com segurança!`],
  [`O adversário tenta a tabela rápida perto da área...`, `A defesa fecha o espaço a tempo!`],
  [`Falta cobrada diretamente ao gol pelo adversário!`, `O goleiro se posiciona bem e pega firme!`],
  [`Chute de primeira do adversário na área! Bola no canto...`, `DEFESA MILAGROSA DO NOSSO GOLEIRO! Jogou na trave!`],
  [`O adversário tenta a bicicleta dentro da área!`, `A bola foi para fora. Que susto!`],
  [`Pênalti quase marcado! O adversário caiu na área...`, `O árbitro mandou o jogo seguir. Nada de pênalti!`],
  [`Pressão do adversário nos últimos minutos! Bola parada perigosa...`, `O zagueiro cabeceou para escanteio. Sufoco!`],
  [`Tiro de meta longo do adversário virou assistência...`, `O nosso goleiro saiu bem e interceptou!`],
]

// ─── Gols sofridos ────────────────────────────────────────────────────────────

const CONCEDED: Array<(opp: string, pl: string) => string[]> = [
  (opp, pl) => [`GOL DO ADVERSÁRIO! ${pl} do ${opp} aproveita falha da defesa e marca!`, `Nosso time precisa se reorganizar rapidamente.`],
  (opp, pl) => [`${pl.toUpperCase()} MARCA PELO ${opp.toUpperCase()}! Chute potente de fora da área!`, `O goleiro não conseguiu segurar. Placar aberto.`],
  (opp, pl) => [`GOL DE CABEÇA DE ${pl.toUpperCase()}! Escanteio do ${opp} aproveitado na segunda trave!`, `Nosso time ficou dormindo na marcação.`],
  (opp, pl) => [`Contra-ataque fatal! ${pl} do ${opp} encontra espaço e finaliza no canto!`, `Nossa equipe precisa voltar para o jogo imediatamente.`],
  (opp, pl) => [`GOOOOL DO ${opp.toUpperCase()}! ${pl} recebe na área e não perdoa!`, `Que finalização precisa. Nada a fazer para o goleiro.`],
  (opp, pl) => [`${pl} arrisca de longe pelo ${opp}... a bola explode no ângulo!`, `Golaço de categoria. Nosso goleiro foi batido sem chance.`],
  (opp, pl) => [`PÊNALTI CONVERTIDO PELO ${opp.toUpperCase()}! ${pl} bate no centro do gol!`, `O goleiro se jogou e ${pl} enganou. Tomamos o gol.`],
  (opp, pl) => [`GOL DE FALTA DO ${opp.toUpperCase()}! ${pl} cobra por baixo da barreira!`, `A barreira pulou, a bola foi embaixo. Que cobrança precisa.`],
  (opp, pl) => [`Jogada coletiva do ${opp}! ${pl} aparece no final para completar!`, `Nossa defesa foi desmanchada na troca de passes.`],
  (opp, pl) => [`${pl} do ${opp} sobe sozinho e cabeceia para o fundo das redes!`, `Marcação individual falhou. Gol cedido na bola aérea.`],
  (opp, pl) => [`Passe em profundidade do ${opp} encontra ${pl} nas costas da defesa!`, `${pl} domina e finaliza com categoria. Tomamos no detalhe.`],
  (opp, pl) => [`Chute de ${pl} do ${opp} desviou em zagueiro nosso e enganou o goleiro!`, `Azar da deflexão. Difícil de defender.`],
  (opp, pl) => [`${pl} do ${opp} dribla nosso zagueiro na área e chuta no ângulo!`, `Individual excepcional. Não tinha muito a fazer.`],
  (opp, pl) => [`Cruzamento preciso do ${opp} na cabeça de ${pl}!`, `${pl} não desperdiçou. Cabeçada no ângulo. Gol sofrido.`],
  (opp, pl) => [`${pl} recebeu a bola de costas, girou e chutou no ângulo! ${opp} marca!`, `Nosso zagueiro não conseguiu impedir o giro. Tomamos!`],
  (opp, pl) => [`Tabelinha rápida do ${opp} na nossa área! ${pl} concluiu de primeira!`, `Fomos superados na velocidade de troca de passes. Gol sofrido.`],
  (opp, pl) => [`${pl} do ${opp} saiu da marcação num momento de bobeira nossa e finalizou!`, `Descuido coletivo. Agora temos que correr atrás do resultado.`],
  (opp, pl) => [`Escanteio cobrado pelo ${opp}, ${pl} subiu sozinho na segunda trave!`, `Marcação individual perdida. Gol sofrido de cabeça!`],
]

// ─── Mensagens táticas (com variação por placar) ─────────────────────────────

const TACTICAL_NEUTRAL = [
  `Nossa equipe controla a posse de bola com tranquilidade.`,
  `O meio-campo dita o ritmo da partida com passes precisos.`,
  `Jogo mais travado no meio-campo. Nenhum dos times consegue criar espaço.`,
  `Nossa equipe troca passes com qualidade. O adversário se fecha na defesa.`,
  `O técnico pede mais intensidade. A equipe responde com volume de jogo!`,
  `Partida equilibrada. Os dois times se anulam no campo.`,
  `Nossa equipe explora bem os espaços nas costas dos laterais adversários.`,
  `Bola no alto, disputa no meio-campo — jogo travado por enquanto.`,
  `A equipe adversária tenta se organizar taticamente, mas nossa posse incomoda.`,
]

const TACTICAL_WINNING = [
  `Nossa equipe administra bem o resultado. O adversário não consegue criar.`,
  `O time joga no conforto. Posse de bola inteligente, sem riscos.`,
  `Gestão de placar exemplar. Nossa equipe encaixa bem no bloco médio.`,
  `O adversário pressiona mas a defesa segura tudo com tranquilidade.`,
  `Com a vantagem no placar, o time lowera o ritmo. Administração inteligente.`,
  `Jogo controlado. Nossa equipe sabe quando sair no contra-ataque.`,
]

const TACTICAL_LOSING = [
  `Nossa equipe tenta reagir, mas o adversário está bem posicionado.`,
  `O desespero começa a aparecer. O time precisa de uma jogada inspirada!`,
  `Precisamos urgentemente de um gol! O técnico gesticula do banco.`,
  `Nossa equipe vai para o tudo ou nada. A defesa do adversário resiste.`,
  `Pressionamos mas falta efetividade. O gol precisa vir!`,
  `O banco pede calma. Mas o relógio corre e o placar não muda.`,
]

// ─── Contexto de gol (prefixo dramático) ─────────────────────────────────────

function goalContextPrefix(
  scoreFor: number,
  scoreAgainst: number,
  minute: number,
  phase: string
): string {
  const isFinal = phase === 'Final'
  const isSemi  = phase === 'Semifinal'
  const isLate  = minute >= 80
  const isExtra = minute >= 87
  const diff    = scoreFor - scoreAgainst

  if (isExtra && isFinal && diff < 0) return `NOS ACRÉSCIMOS DA FINAL! REAÇÃO HISTÓRICA! `
  if (isExtra && isFinal && diff === 0) return `NOS ACRÉSCIMOS DA GRANDE FINAL! `
  if (isExtra && diff < 0)             return `NOS ACRÉSCIMOS! EMPATOU DE VIRADA! `
  if (isExtra && diff === 0)           return `NOS ACRÉSCIMOS! `
  if (isLate  && isFinal && diff < 0)  return `REAGIU NA FINAL! `
  if (isLate  && diff < 0)             return `DE VIRADA! O TIME NÃO DESISTIU! `
  if (diff < 0)                        return `EMPATOU! O TIME REAGE! `
  if (isFinal && diff === 0)           return `NA GRANDE FINAL! `
  if (isSemi  && diff === 0)           return `NA SEMIFINAL! `
  return ''
}

// ─── Seleção de jogada por posição ────────────────────────────────────────────

function selectGoalPlay(
  position: string,
  _isLegend: boolean,
  r: number,
  usedIndices: Set<number>,
  globalUsed: Set<number>
): { play: GoalPlay; idx: number } {
  const specific  = GOAL_PLAYS.map((p, i) => ({ p, i })).filter(({ p }) => p.positions.includes(position))
  const universal = GOAL_PLAYS.map((p, i) => ({ p, i })).filter(({ p }) => p.positions.length === 0)
  const preferred = [...specific, ...universal]

  // Prioritize not used in this match AND not used globally
  let pool = preferred.filter(({ i }) => !usedIndices.has(i) && !globalUsed.has(i))
  // Fallback: not used in this match
  if (pool.length === 0) pool = preferred.filter(({ i }) => !usedIndices.has(i))
  // Last resort: reset within-match tracking
  if (pool.length === 0) {
    usedIndices.clear()
    pool = preferred
  }

  const idx = Math.floor(r * pool.length)
  const chosen = pool[idx % pool.length]
  usedIndices.add(chosen.i)
  globalUsed.add(chosen.i)
  return { play: chosen.p, idx: chosen.i }
}

// ─── Gerador principal ───────────────────────────────────────────────────────

export function generateMatchMoments(
  picks: import('./game').PickedPlayer[],
  opponent: string,
  goalsFor: number,
  goalsAgainst: number,
  seed: string,
  matchIdx: number,
  opponentScorerNames: string[] = [],
  phase = 'Grupos',
  matchEvents?: import('./game').MatchEvent[],
  globalUsedPlays?: Set<number>
): MatchMoment[] {
  const allPlayers = picks.map(p => p.player.name)
  const attackers  = picks.filter(p => ['CA', 'MEI', 'PD', 'PE', 'MD', 'ME'].includes(p.player.primaryPosition))
  const scorers    = attackers.length ? attackers : picks

  const actualGoalScorers = matchEvents?.filter(e => e.type === 'goal').map(e => e.playerName) ?? []

  const moments: MatchMoment[] = []
  const usedMinutes = new Set<number>()
  const usedGoalPlays = new Set<number>()
  const sharedGlobal = globalUsedPlays ?? new Set<number>()

  const shuffledMissed   = seededShuffle(MISSED_PLAYS,   seed, matchIdx, 3)
  const shuffledDangers  = seededShuffle(DANGERS,        seed, matchIdx, 4)
  const shuffledConceded = seededShuffle(CONCEDED,       seed, matchIdx, 5)
  const shuffledAllPlayers = seededShuffle(allPlayers, seed, matchIdx + 77, 10)
  let mIdx = 0, dIdx = 0, cIdx = 0

  const addMinute = (base: number, off: number): number => {
    let m = Math.min(90, Math.max(1, base + Math.floor(hashR(seed, matchIdx, off) * 12) - 6))
    while (usedMinutes.has(m)) m = Math.min(90, m + 1)
    usedMinutes.add(m)
    return m
  }

  type GoalEvent  = { min: number; scorer: typeof scorers[0]; isOurs: true }
  type OtherEvent = { min: number; isOurs: false; oppScorer: string }
  type AllEvent   = GoalEvent | OtherEvent

  const allEvents: AllEvent[] = []

  for (let i = 0; i < goalsFor; i++) {
    const min = addMinute(18 + i * 18, i * 7)
    const actualName = actualGoalScorers[i]
    const scorer = (actualName ? scorers.find(s => s.player.name === actualName) : null)
      ?? scorers[Math.floor(hashR(seed, matchIdx, i * 3 + 1) * scorers.length)]
    allEvents.push({ min, scorer, isOurs: true })
  }

  for (let i = 0; i < goalsAgainst; i++) {
    const min = addMinute(15 + i * 22, i * 11 + 50)
    const oppScorer =
      opponentScorerNames[i] ??
      opponentScorerNames[Math.floor(hashR(seed, matchIdx, i * 5 + 9) * Math.max(1, opponentScorerNames.length))] ??
      opponent
    allEvents.push({ min, isOurs: false, oppScorer })
  }

  allEvents.sort((a, b) => a.min - b.min)

  let scoreFor = 0, scoreAgainst = 0

  allEvents.forEach((ev, i) => {
    if (ev.isOurs) {
      const g = ev as GoalEvent
      const scorerName = g.scorer?.player.name ?? allPlayers[0]
      const scorerPos  = g.scorer?.player.primaryPosition ?? 'CA'
      const { play } = selectGoalPlay(
        scorerPos,
        g.scorer?.player.isLegend ?? false,
        hashR(seed, matchIdx, i * 7 + 20),
        usedGoalPlays,
        sharedGlobal,
      )

      moments.push({
        minute: Math.max(1, g.min - 1),
        type: 'buildup',
        forUs: true,
        playerName: scorerName,
        lines: play.buildup(scorerName),
        isGoal: false,
      })

      const prefix    = goalContextPrefix(scoreFor, scoreAgainst, g.min, phase)
      const goalLines = play.goal(scorerName)
      const lines     = prefix
        ? [`${prefix}${goalLines[0]}`, ...goalLines.slice(1)]
        : goalLines

      moments.push({
        minute: g.min,
        type: 'goal',
        forUs: true,
        playerName: scorerName,
        lines,
        isGoal: true,
      })

      scoreFor++
    } else {
      const oe = ev as OtherEvent
      moments.push({
        minute: oe.min,
        type: 'conceded',
        forUs: false,
        lines: shuffledConceded[cIdx++ % shuffledConceded.length](opponent, oe.oppScorer),
        isGoal: true,
      })
      scoreAgainst++
    }
  })

  const extraChances = 2 + Math.floor(hashR(seed, matchIdx, 99) * 3)
  for (let i = 0; i < extraChances; i++) {
    const min    = addMinute(10 + i * 15, i * 13 + 200)
    const pIdx   = Math.floor(hashR(seed, matchIdx, i * 4 + 100) * shuffledAllPlayers.length)
    const player = shuffledAllPlayers[pIdx]
    const missed = shuffledMissed[mIdx++ % shuffledMissed.length]

    moments.push({
      minute: Math.max(1, min - 1),
      type: 'buildup',
      forUs: true,
      playerName: player,
      lines: missed.buildup(player),
      isGoal: false,
    })
    moments.push({
      minute: min,
      type: 'save',
      forUs: true,
      lines: missed.save,
      isGoal: false,
    })
  }

  const dangerCount = 1 + Math.floor(hashR(seed, matchIdx, 88) * 2)
  for (let i = 0; i < dangerCount; i++) {
    const min = addMinute(25 + i * 30, i * 17 + 300)
    moments.push({
      minute: min,
      type: 'danger',
      forUs: false,
      lines: shuffledDangers[dIdx++ % shuffledDangers.length],
      isGoal: false,
    })
  }

  const tacMin  = addMinute(40, 400)
  const finalDiff = scoreFor - scoreAgainst
  const tacPool = finalDiff > 1
    ? TACTICAL_WINNING
    : finalDiff < 0
      ? TACTICAL_LOSING
      : TACTICAL_NEUTRAL
  const tacIdx  = Math.floor(hashR(seed, matchIdx, 500) * tacPool.length)
  moments.push({
    minute: tacMin,
    type: 'tactical',
    forUs: true,
    lines: [tacPool[tacIdx]],
    isGoal: false,
  })

  moments.sort((a, b) => a.minute - b.minute || (a.type === 'buildup' ? -1 : 1))
  return moments
}
