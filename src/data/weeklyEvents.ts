import type { GameState, WeekEvent } from '../types/game'

export type { WeekEvent }

const TRAINING_EVENTS: WeekEvent[] = [
  {
    text: "Você chega cedo ao campo, antes dos outros. Repete o movimento roubado até o corpo entendê-lo — não a cabeça.",
    type: 'treino',
  },
  {
    text: "O técnico para o treino para te observar. 'Onde você aprendeu isso?' Você sorri: 'Sempre estive aprendendo, professor.'",
    type: 'treino',
    choices: [
      {
        label: "Inventar algo convincente",
        consequence: "Você improvisa uma história sobre um professor particular. O técnico aceita. Sua reputação de 'dedicado' cresce.",
        effect: { reputation: 8 },
      },
      {
        label: "Dizer que treinou sozinho",
        consequence: "O técnico franze o cenho, mas respeita a honestidade. Ele passa a te observar mais — o que pode ser bom ou perigoso.",
        effect: { reputation: 3, coins: 50 },
      },
    ],
  },
  {
    text: "Sessão individual às 7h da manhã. Você trabalha o traço até o músculo saber mais do que a memória.",
    type: 'treino',
  },
  {
    text: "No coletivo, você executa uma jogada que ninguém espera. Dois companheiros perguntam ao mesmo tempo: 'Como fez isso?'",
    type: 'treino',
    choices: [
      {
        label: "Ensinar a jogada",
        consequence: "Você compartilha uma versão simplificada. Os colegas ficam gratos. O técnico nota seu espírito de equipe.",
        effect: { reputation: 12 },
      },
      {
        label: "Guardar o segredo",
        consequence: "Você sorri misterioso. O segredo fica guardado. Mas a curiosidade dos colegas aumenta.",
        effect: { coins: 80 },
      },
    ],
  },
  {
    text: "Você pratica sozinho no vestiário vazio depois do treino. É arriscado. Mas é necessário.",
    type: 'treino',
  },
  {
    text: "Aquecimento antes do jogo. Cada traço roubado parece mais afiado quando o momento chega.",
    type: 'treino',
  },
  {
    text: "Treino de finalizações. O gol parece maior hoje. Você não sabe se é confiança ou o traço falando mais alto.",
    type: 'treino',
  },
  {
    text: "Você erra um drible no treino. Sente o traço resistir, como se quisesse voltar pro dono. Você insiste.",
    type: 'treino',
    choices: [
      {
        label: "Insistir no drible — o traço é seu",
        consequence: "Você força o movimento até acertar. Exaustivo. Mas o traço recua. Pequena vitória.",
        effect: { reputation: 5 },
      },
      {
        label: "Mudar de abordagem — adaptar o movimento",
        consequence: "Você cria sua própria versão do drible. Menos puro, mas 100% seu. Talvez seja melhor assim.",
        effect: { coins: 60 },
      },
    ],
  },
  {
    text: "Tarde livre. O clube paga bônus a quem treinar extra hoje.",
    type: 'treino',
    choices: [
      {
        label: "Treinar extra — pegar o bônus",
        consequence: "Duas horas a mais. Você está cansado mas mais rico. Vale a pena.",
        effect: { coins: 120 },
      },
      {
        label: "Descansar — o corpo precisa",
        consequence: "Você passa a tarde vendo os jogos da rodada no bar. Na semana seguinte, está afiado.",
        effect: { reputation: 4 },
      },
    ],
  },
  {
    text: "Coletivo pesado. O técnico elogia sua intensidade. Você sabe que é o traço falando por você.",
    type: 'treino',
  },
]

const LEGEND_EVENTS: WeekEvent[] = [
  {
    text: "No jornal esportivo de hoje: 'Garoto de 16 anos faz história na base do Cruzeiro. Chama-se Ronaldo.' Você dobra o jornal. Só você sabe o que ele vai se tornar.",
    type: 'lenda',
    choices: [
      {
        label: "Ir assistir ao treino dele — de longe",
        consequence: "Você fica nas arquibancadas por uma hora. O garoto é extraordinário. Você sente seus traços reconhecendo o dono.",
        effect: { reputation: 6 },
      },
      {
        label: "Guardar a informação — agir na hora certa",
        consequence: "Paciente. Você anota mentalmente: Ronaldo, Cruzeiro, 16 anos. O tempo vai chegar.",
        effect: { coins: 40 },
      },
    ],
  },
  {
    text: "Passa no rádio: Ronaldinho Gaúcho marcou três gols pelo Grêmio sub-17. Uma criança ainda. Mas você viu o futuro.",
    type: 'lenda',
  },
  {
    text: "Você cruza com um garoto jogando bola na rua. O menino tem um drible que lembra algo que você roubou. Por um segundo, o traço reconhece o dono.",
    type: 'lenda',
    choices: [
      {
        label: "Observar e continuar andando",
        consequence: "Você guarda a cena mentalmente. Aquele garoto vai ser alguém um dia. Você sabe disso.",
        effect: { reputation: 3 },
      },
      {
        label: "Parar e jogar com ele",
        consequence: "Meia hora de pelada improvisada com o garoto e seus amigos. A cidade vê um jogador brincar com crianças. Boa imagem.",
        effect: { reputation: 15, coins: -20 },
      },
    ],
  },
  {
    text: "Adriano aparece numa peneira em São Paulo. Dezesseis anos, pé esquerdo que parece canhão. Você se afasta discretamente.",
    type: 'lenda',
  },
  {
    text: "Notícia: 'Cafu confirma presença na Seleção Brasileira.' Você arquiva mentalmente: janela fechando em breve.",
    type: 'lenda',
  },
  {
    text: "Roberto Carlos aparece numa partida de exibição perto daqui. Você o observa discretamente. O traço no seu pé vibra ao vê-lo.",
    type: 'lenda',
  },
  {
    text: "Você escuta um técnico rival elogiar 'um garoto do Sul chamado Ronaldinho'. Você nod: já sabe o fim dessa história.",
    type: 'lenda',
  },
  {
    text: "Na TV passam os melhores dribles do campeonato nacional. Uma jogada sua aparece. Você sente orgulho — e medo.",
    type: 'lenda',
  },
  {
    text: "Dida treina num clube amador do Rio. Quinze anos, alto demais para a idade. Você vê o goleiro antes do título.",
    type: 'lenda',
  },
  {
    text: "Lula Passos, empresário do momento, anda rondando o campeonato regional. Você sabe exatamente o que ele está procurando.",
    type: 'lenda',
  },
]

const CLUB_EVENTS: WeekEvent[] = [
  {
    text: "O técnico convoca reunião antes da semana de jogo: 'Precisamos da nossa melhor versão.' Você sabe que está pronto.",
    type: 'clube',
  },
  {
    text: "O ônibus do clube quebrou a caminho do treino. Uma hora parado na estrada. Seus companheiros reclamam. Você pensa nos treinos que perdeu em 2008.",
    type: 'clube',
  },
  {
    text: "A torcida comparece ao treino aberto. Crianças pedem autógrafo. Você assina, pensando que elas um dia vão contar que te conheceram.",
    type: 'clube',
  },
  {
    text: "O clube anunciou bônus por vitórias no campeonato. O vestiário acende.",
    type: 'clube',
    choices: [
      {
        label: "Liderar o grupo — cobrar todos",
        consequence: "Você faz um discurso no vestiário. Alguns se incomodam. Mas o grupo fica unido. O técnico aprecia.",
        effect: { reputation: 14 },
      },
      {
        label: "Focar em você — jogar pelo bônus",
        consequence: "Você deixa o coletivo pra lá e foca na própria performance. Egoísta, mas eficiente.",
        effect: { coins: 100 },
      },
    ],
  },
  {
    text: "Seu técnico te chama no final do treino: 'Você está diferente esse ano. Mais maduro.' Se ele soubesse.",
    type: 'clube',
  },
  {
    text: "Um companheiro mais velho oferece conselho sobre a vida no futebol. Você escuta. Ele não sabe que você já viveu o fim.",
    type: 'clube',
  },
  {
    text: "Seu técnico te chama: 'Preciso de você como capitão nesse jogo. Aceita a braçadeira?'",
    type: 'clube',
    choices: [
      {
        label: "Aceitar — assumir a responsabilidade",
        consequence: "A braçadeira pesa, mas você carrega bem. O time responde. Sua liderança cresce.",
        effect: { reputation: 18 },
      },
      {
        label: "Recusar — preferir jogar livre",
        consequence: "Você explica que rende mais sem a pressão de capitão. O técnico entende. Você joga melhor.",
        effect: { coins: 70 },
      },
    ],
  },
  {
    text: "Novo patrocinador assina com o clube. O uniforme chega amanhã. Pequeno passo, mas parece profissional.",
    type: 'clube',
  },
  {
    text: "Dia de folga. Você vai ao cinema ver um filme de ação. Por algumas horas, não pensa em traços nem no futuro.",
    type: 'clube',
  },
  {
    text: "Um ex-jogador do clube vem dar palestra. Ele fala sobre dedicação. Você pensa: 'Se soubesse o que eu carrego.'",
    type: 'clube',
  },
]

const PRE_MATCH_EVENTS: WeekEvent[] = [
  {
    text: "A semana de jogo chegou. A cidade parece mais animada. Você sente o traço roubado vibrar — ele também sabe que é dia de mostrar serviço.",
    type: 'clube',
  },
  {
    text: "Véspera do jogo. Você dorme mal — não de ansiedade, de antecipação. Afinal, você já viveu uma final de Copa do Mundo. Mas isso aqui tem seu próprio peso.",
    type: 'clube',
  },
  {
    text: "O técnico distribuiu a escalação: você está no time titular. Amanhã, 15h.",
    type: 'clube',
  },
  {
    text: "Na manhã do jogo você aquece sozinho. Cada traço roubado parece mais afiado quando o momento chega.",
    type: 'treino',
  },
  {
    text: "Dia de jogo. O vestiário cheira a tensão e linimento. Você fecha os olhos e sente o talento de outra pessoa no seu corpo.",
    type: 'clube',
  },
  {
    text: "A torcida começa a chegar nas horas antes do jogo. Você ouve os cantos lá de fora enquanto amarra as chuteiras.",
    type: 'clube',
  },
]

const SUSPICION_EVENTS: WeekEvent[] = [
  {
    text: "Um jornalista do jornal local perguntou sobre sua melhora repentina.",
    type: 'suspeita',
    choices: [
      {
        label: "Inventar uma história sobre férias produtivas",
        consequence: "O jornalista compra a história. 'Dedicação fora de temporada' vira manchete. Sua imagem melhora.",
        effect: { reputation: 10 },
      },
      {
        label: "Ser vago e esquivo",
        consequence: "O jornalista não fica satisfeito. Ele vai investigar. Você sente a pressão aumentar.",
        effect: { reputation: -5 },
      },
    ],
  },
  {
    text: "O técnico rival te observa com atenção excessiva durante o aquecimento. Mais atenção do que deveria.",
    type: 'suspeita',
  },
  {
    text: "Um colega do vestiário comentou: 'Você jogava assim antes?' Você ri. 'Sempre quis jogar assim.'",
    type: 'suspeita',
  },
  {
    text: "Rumor no campeonato: algum clube maior perguntou sobre você. Isso é bom e perigoso ao mesmo tempo.",
    type: 'suspeita',
    choices: [
      {
        label: "Alimentar o interesse — negociar",
        consequence: "Você manda mensagem pro intermediário. Nada de concreto, mas a semente está plantada.",
        effect: { coins: 150, reputation: 5 },
      },
      {
        label: "Ignorar — manter o perfil baixo",
        consequence: "Melhor não chamar atenção desnecessária. Por enquanto, o anonimato te protege.",
        effect: { reputation: 8 },
      },
    ],
  },
  {
    text: "Um fisioterapeuta te observa se aquecer e comenta: 'Sua biomecânica mudou.' Você muda de assunto.",
    type: 'suspeita',
  },
  {
    text: "Seu agente liga perguntando se você tomou algum suplemento novo. 'Só trabalho duro', você responde.",
    type: 'suspeita',
  },
]

const WORLD_EVENTS: Record<number, string> = {
  1992: "Brasil sedia a Conferência Rio-92. O mundo inteiro está aqui — e o futebol respira junto com a política.",
  1993: "Seleção Brasileira invicta nas Eliminatórias para a Copa de 94. O tetra parece possível pela primeira vez desde 1970.",
  1994: "Copa do Mundo nos EUA começa em junho. Brasil vai tentar o tetra. Você sabe o final dessa história.",
  1995: "Ronaldo transferido para o Barcelona por recorde mundial. A Europa acabou de descobrir o futuro.",
  1996: "Brasil perde o ouro olímpico em Atlanta para a Nigéria. Uma geração de lendas sem medalha olímpica.",
  1997: "Copa das Confederações: Brasil vence mais um torneio continental. A máquina está azeitada para 98.",
  1998: "Copa na França. Você sabe o que vai acontecer com Ronaldo antes da final. Mas não pode dizer nada.",
  1999: "Palmeiras vence a Libertadores. O futebol paulista domina o continente.",
  2000: "Campeonato Brasileiro reformulado: 116 clubes. Uma confusão, mas é o futebol que você ama.",
  2001: "Ronaldinho Gaúcho vai para o PSG. A Europa está começando a entender o que é futebol brasileiro.",
  2002: "Copa no Japão e Coreia. Ronaldo vai marcar 8 gols e terminar como Fenômeno de verdade. Você sabe. Todos vão descobrir.",
  2003: "Ronaldinho vai para o Barcelona. Uma era dourada começa — você tem ringside para a história.",
  2004: "Adriano arrasa no Inter de Milão. O Imperador assumiu o trono. Você o viu quando ainda era um garoto.",
  2005: "Ronaldinho vence a Bola de Ouro. Melhor do mundo. Você sente o traço pulsando com mais força.",
  2006: "Copa na Alemanha. Zidane se despede com uma cabeçada. Brasil cai nas quartas. Dói, mas você sabia.",
  2007: "Você está construindo algo que vai durar além de você. Um legado que vai passar de pai para filho.",
  2008: "A nova geração surge. Messi e CR7 dominam a Europa. O mundo não sabe ainda o que está por vir.",
  2009: "Kaká vence a Bola de Ouro. O último antes de uma décade de Messi e CR7. Você ainda tem tempo.",
  2010: "Copa no Brasil? Não — ainda é na África do Sul. Espanha vence. Uma era de tiki-taka começa.",
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateWeekEvents(state: GameState, isPreMatch: boolean): WeekEvent[] {
  const events: WeekEvent[] = []

  if (isPreMatch) {
    events.push(pickRandom(PRE_MATCH_EVENTS))
    if (Math.random() < 0.5) {
      events.push(pickRandom(TRAINING_EVENTS))
    }
    const worldEvent = WORLD_EVENTS[state.currentYear]
    if (worldEvent && Math.random() < 0.4) {
      events.push({ text: worldEvent, type: 'mundo' })
    }
    return events.slice(0, 2)
  }

  // Always one training event
  events.push(pickRandom(TRAINING_EVENTS))

  // 60% chance of legend event
  if (Math.random() < 0.60) {
    events.push(pickRandom(LEGEND_EVENTS))
  }

  // 40% chance of suspicion event
  if (Math.random() < 0.40) {
    events.push(pickRandom(SUSPICION_EVENTS))
  }

  // 50% chance of club event
  if (events.length < 3 && Math.random() < 0.50) {
    events.push(pickRandom(CLUB_EVENTS))
  }

  // World event
  const worldEvent = WORLD_EVENTS[state.currentYear]
  if (worldEvent && events.length < 3 && Math.random() < 0.5) {
    events.push({ text: worldEvent, type: 'mundo' })
  }

  // Trait-specific event
  if (state.stolenTraits.length > 0 && events.length < 3 && Math.random() < 0.4) {
    const trait = state.stolenTraits[Math.floor(Math.random() * state.stolenTraits.length)]
    const traitTexts = [
      `${trait.traitIcon} O traço de ${trait.traitName} parece inquieto esta semana. Ele quer ser usado — ou vai perdendo força aos poucos.`,
      `Você treina ${trait.traitName} em segredo. A barra está em ${trait.maintenanceBar}% — precisa manter isso acima de 30%.`,
      `${trait.traitName} (${trait.legendNickname}): ${trait.maintenanceBar >= 70 ? 'em plena forma. Use nas partidas.' : trait.maintenanceBar >= 30 ? 'razoável. Não negligencie.' : '⚠️ fraco. Precisa de manutenção urgente.'}`,
    ]
    events.push({ text: pickRandom(traitTexts), type: 'traço' })
  }

  return events.slice(0, 3)
}
