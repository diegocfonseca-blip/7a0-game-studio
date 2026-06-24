import type { GameState, WeekEvent } from '../types/game'

export type { WeekEvent }

const TRAINING_EVENTS = [
  "Você chega cedo ao campo, antes dos outros. Repete o movimento que roubou até o corpo entendê-lo — não a cabeça.",
  "O técnico para o treino para te observar. 'Onde você aprendeu isso?' Você sorri: 'Sempre estive aprendendo, professor.'",
  "Sessão individual às 7h da manhã. Você trabalha o traço até o músculo saber mais do que a memória.",
  "No coletivo, você executa uma jogada que ninguém espera. Dois companheiros perguntam ao mesmo tempo: 'Como fez isso?'",
  "Você pratica sozinho no vestiário vazio depois do treino. É arriscado. Mas é necessário.",
  "Aquecimento antes do jogo. Cada traço roubado parece mais afiado quando o momento chega.",
  "Treino de finalizações. O gol parece maior hoje. Você não sabe se é confiança ou o traço falando mais alto.",
  "Você erra um drible no treino. Sente o traço resistir, como se quisesse voltar pro dono. Você insiste.",
  "Tarde livre. Você vai a um campo de terra e treina sozinho por três horas. Ninguém vê. É onde o verdadeiro treino acontece.",
  "Coletivo pesado. O técnico elogia sua intensidade. Você sabe que é o traço falando por você.",
]

const LEGEND_EVENTS = [
  "No jornal esportivo de hoje: 'Garoto de 16 anos faz história na base do Cruzeiro. Chama-se Ronaldo.' Você dobra o jornal. Só você sabe o que ele vai se tornar.",
  "Passa no rádio: Ronaldinho Gaúcho marcou três gols pelo Grêmio sub-17. Uma criança ainda. Mas você viu o futuro.",
  "Você cruza com um garoto jogando bola na rua. O menino tem um drible que lembra algo que você roubou. Por um segundo, o traço reconhece o dono.",
  "Adriano aparece numa peneira em São Paulo. Dezesseis anos, pé esquerdo que parece canhão. Você se afasta discretamente.",
  "Notícia: 'Cafu confirma presença na Seleção Brasileira.' Você arquiva mentalmente: janela fechando em breve.",
  "Roberto Carlos aparece numa partida de exibição perto daqui. Você o observa discretamente. O traço no seu pé vibra ao vê-lo.",
  "Você escuta um técnico rival elogiar 'um garoto do Sul chamado Ronaldinho'. Você nod: já sabe o fim dessa história.",
  "Na TV passam os melhores dribles do campeonato nacional. Uma jogada sua aparece. Você sente orgulho — e medo.",
  "Dida treina num clube amador do Rio. Quinze anos, alto demais para a idade. Você vê o goleiro antes do título.",
  "Lula Passos, empresário do momento, anda rondando o campeonato regional. Você sabe exatamente o que ele está procurando.",
]

const CLUB_EVENTS = [
  "O técnico convoca reunião antes da semana de jogo: 'Precisamos da nossa melhor versão.' Você sabe que está pronto.",
  "O ônibus do clube quebrou a caminho do treino. Uma hora parado na estrada. Seus companheiros reclamam. Você pensa nos treinos que perdeu em 2008.",
  "A torcida comparece ao treino aberto. Crianças pedem autógrafo. Você assina, pensando que elas um dia vão contar que te conheceram.",
  "Um companheiro mais velho oferece conselho sobre a vida no futebol. Você escuta. Ele não sabe que você já viveu o fim.",
  "O clube anunciou bônus por vitórias no campeonato. O vestiário acende.",
  "Novo patrocinador assina com o clube. O uniforme chega amanhã. Pequeno passo, mas parece profissional.",
  "Seu técnico te chama no final do treino: 'Você está diferente esse ano. Mais maduro.' Se ele soubesse.",
  "Dia de folga. Você vai ao cinema ver um filme de ação. Por algumas horas, não pensa em traços nem em 2008.",
  "Reunião de plantel. O técnico mostra vídeo do próximo adversário. Você vê buracos na defesa deles que ninguém mais percebe.",
  "Um ex-jogador do clube vem dar palestra. Ele fala sobre dedicação. Você pensa: 'Se soubesse o que eu carrego.'",
]

const PRE_MATCH_EVENTS = [
  "A semana de jogo chegou. A cidade parece mais animada. Você sente o traço roubado vibrar — ele também sabe que é dia de mostrar serviço.",
  "Véspera do jogo. Você dorme mal — não de ansiedade, de antecipação. Afinal, você já viveu uma final de Copa do Mundo. Mas isso aqui tem seu próprio peso.",
  "O técnico distribuiu a escalação: você está no time titular. Amanhã, 15h.",
  "Na manhã do jogo você aquece sozinho. Cada traço roubado parece mais afiado quando o momento chega.",
  "Dia de jogo. O vestiário cheira a tensão e linimento. Você fecha os olhos e sente o talento de outra pessoa no seu corpo.",
  "A torcida começa a chegar nas horas antes do jogo. Você ouve os cantos lá de fora enquanto amarra as chuteiras.",
]

const SUSPICION_EVENTS = [
  "Um jornalista do jornal local perguntou sobre sua melhora repentina. Você inventou algo sobre 'férias produtivas e foco renovado'.",
  "O técnico rival te observa com atenção excessiva durante o aquecimento. Mais atenção do que deveria.",
  "Um colega do vestiário comentou: 'Você jogava assim antes?' Você ri. 'Sempre quis jogar assim.'",
  "Rumor no campeonato: algum clube maior perguntou sobre você. Isso é bom e perigoso ao mesmo tempo.",
  "Um fisioterapeuta te observa se aquecer e comenta: 'Sua biomecânica mudou.' Você muda de assunto.",
  "Seu agente liga perguntando se você tomou algum suplemento novo. 'Só trabalho duro', você responde.",
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
  2007: "Seu último ano antes de 2008. Você tem pouco mais de um ano. O que este passado roubado vai deixar?",
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateWeekEvents(state: GameState, isPreMatch: boolean): WeekEvent[] {
  const events: WeekEvent[] = []

  // Pre-match week: use pre-match specific events + maybe world event
  if (isPreMatch) {
    events.push({ text: pickRandom(PRE_MATCH_EVENTS), type: 'clube' })
    if (Math.random() < 0.5) {
      events.push({ text: pickRandom(TRAINING_EVENTS), type: 'treino' })
    }
    const worldEvent = WORLD_EVENTS[state.currentYear]
    if (worldEvent && Math.random() < 0.4) {
      events.push({ text: worldEvent, type: 'mundo' })
    }
    return events.slice(0, 2)
  }

  // Regular week: mix of categories
  // Always one training event
  events.push({ text: pickRandom(TRAINING_EVENTS), type: 'treino' })

  // 60% chance of legend event
  if (Math.random() < 0.60) {
    events.push({ text: pickRandom(LEGEND_EVENTS), type: 'lenda' })
  }

  // 40% chance of suspicion event
  if (Math.random() < 0.40) {
    events.push({ text: pickRandom(SUSPICION_EVENTS), type: 'suspeita' })
  }

  // 50% chance of club event (if not already 3 events)
  if (events.length < 3 && Math.random() < 0.50) {
    events.push({ text: pickRandom(CLUB_EVENTS), type: 'clube' })
  }

  // World event (historical, if available) - always add if space and we haven't shown it recently
  const worldEvent = WORLD_EVENTS[state.currentYear]
  if (worldEvent && events.length < 3 && Math.random() < 0.5) {
    events.push({ text: worldEvent, type: 'mundo' })
  }

  // Trait-specific event (if player has stolen traits)
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
