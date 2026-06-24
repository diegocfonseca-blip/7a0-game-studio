export interface MissionPhaseChoice {
  text: string
  score: number
  outcome: string
}

export interface MissionPhase {
  scene: string
  choices: MissionPhaseChoice[]
}

export interface MissionData {
  legendId: string
  travelCost: number
  scoutCost: number
  intro: string
  travelNarration?: string
  phases: MissionPhase[]
  successText: string
  partialText: string
  failText: string
}

export const MISSIONS: Record<string, MissionData> = {

  // ── BRASIL ─────────────────────────────────────────────────────────────

  r9: {
    legendId: 'r9',
    travelCost: 0,
    scoutCost: 400,
    intro: 'Belo Horizonte, Venda Nova. Você gastou o que tinha de scout pra localizar o garoto. Um informante confirmou: treina todo dia num campo de terra perto do Cruzeiro. O formigamento nas suas mãos está diferente — mais pesado — do que qualquer pelada que você já jogou. Vai ser diferente.',
    phases: [
      {
        scene: 'Você chega ao campo às 16h. Ele já está lá, sem camisa, chutando contra o muro. Cada chute tem um som diferente — mais seco, mais grave. Três garotos mais velhos estão na arquibancada assistindo em silêncio. Ninguém fala. Só o som do couro no concreto.',
        choices: [
          {
            text: 'Sentar na arquibancada e esperar ele parar',
            score: 3,
            outcome: 'Você fica quieto por quarenta minutos. Ele te nota mas não se importa. Quando para pra tomar água, você desce natural.'
          },
          {
            text: 'Entrar no campo direto e pedir pra jogar',
            score: 2,
            outcome: 'Ele olha de cima a baixo. Você é mais velho. Mas aceita — orgulho de jogador não recusa desafio.'
          },
          {
            text: 'Perguntar pra um dos garotos quem é ele',
            score: 1,
            outcome: 'Os garotos te olham estranho. "Não conhece o Ronaldo?" Agora você chamou atenção demais no lugar errado.'
          }
        ]
      },
      {
        scene: 'Você está jogando com ele. Um x1 que começou simples e virou sério. Ele está te driblando com uma facilidade que dói no ego. O formigamento nas mãos sobe. Você sabe o que vai acontecer a seguir. E ele não sabe.',
        choices: [
          {
            text: 'Provocar ele pra intensificar — "não é tão bom assim"',
            score: 3,
            outcome: 'Ele acende. Orgulho de craque. Pressiona mais, chega mais perto. Exatamente o que você precisava.'
          },
          {
            text: 'Aceitar a derrota e criar um clima leve',
            score: 2,
            outcome: 'Ele relaxa. A guarda baixa. Uma abertura vai aparecer.'
          },
          {
            text: 'Fingir que machucou o tornozelo pra parar',
            score: 1,
            outcome: 'Ele desconfia. Esse garoto lê pessoas. Algo mudou na dinâmica.'
          }
        ]
      },
      {
        scene: 'Você está no momento. Ele avança com a bola. O formigamento explode. É agora ou nunca — em 1993 ele assina com o Cruzeiro e a janela fecha pra sempre. A falta precisa ser dentro do jogo. Natural. Invisível.',
        choices: [
          {
            text: 'Entrada de frente — disputa limpa pelo chão enquanto ele avança',
            score: 3,
            outcome: 'Você vai nos dois pés. Ele tenta desviar. O choque de canelas é seco e real. O formigamento explode. Ele pisca, fica parado por um segundo. Depois sorri. Não sabe o que aconteceu.'
          },
          {
            text: 'Choque de ombro quando ele tenta driblar',
            score: 2,
            outcome: 'Um encontrão de ombro no meio do dribble. Natural num jogo físico. Algo passa — mas rápido demais.'
          },
          {
            text: 'Empurrão por trás quando ele já está passando por você',
            score: 1,
            outcome: 'Tarde. O contato foi nos costas, superficial. Quase nada passou entre vocês.'
          }
        ]
      }
    ],
    successText: 'O formigamento para. Uma onda sobe pelo seu braço e se espalha. Você conseguiu. Ele vai embora sem saber o que perdeu nas canelas naquela dividida. E você... vai ser diferente daqui pra frente.',
    partialText: 'Algo passou — incompleto, mas real. O contato foi curto demais. O traço está em você, mas frágil. Vai exigir muito cuidado.',
    failText: 'Não funcionou. O contato foi superficial ou na hora errada. Ele vai embora inteiro. Em 1993 ele assina com o Cruzeiro — essa janela fecha pra sempre.'
  },

  ronaldinho: {
    legendId: 'ronaldinho',
    travelCost: 700,
    scoutCost: 250,
    intro: 'Porto Alegre, inverno. 13 horas de ônibus de BH. Você economizou. Um contato te disse que um garoto de 12 anos joga pelada no campo de areia do Vila Nova toda tarde de sábado. O irmão dele, Assis, já está no Grêmio. O garoto joga descalço às vezes porque prefere.',
    travelNarration: 'Você pegou o ônibus na rodoviária de BH às 22h com uma mochila pequena. Chegou em Porto Alegre com frio e sem dormir. Foi direto pro Vila Nova.',
    phases: [
      {
        scene: 'O campo é de areia. Traves de cano amarrado. Mas a qualidade de jogo ali te surpreende. Você o identifica na hora — não pela altura, mas pela bola. Ela faz coisas diferentes quando chega nele. E ele sorri como se nada fosse difícil. Os outros garotos riem junto mesmo quando ele os humilha.',
        choices: [
          {
            text: 'Pedir pra entrar no time que está esperando na beira',
            score: 3,
            outcome: 'Democrático. Qualquer um pode jogar. Você está dentro. Natural, sem suspeita.'
          },
          {
            text: 'Assistir de fora e esperar o jogo acabar',
            score: 2,
            outcome: 'Você assiste. E fica encantado. Quando o jogo acaba você tem algo genuíno pra dizer.'
          },
          {
            text: 'Aparecer com uma bola nova e oferecer pra galera',
            score: 1,
            outcome: 'Eles ficam felizes com a bola, mas você virou o cara estranho que apareceu com bola nova do nada. Suspeito.'
          }
        ]
      },
      {
        scene: 'Você está no jogo. E o que você percebe é que ele te inclui — te passa a bola, abre espaço pra você. Parece que quer que todos sejam bons. Nunca viu isso num campo. O formigamento pulsa enquanto vocês jogam. A pelada está intensa. Corpos chegando perto. A chance vai aparecer.',
        choices: [
          {
            text: 'Deixar ele brilhar e ser seu apoio — finja ser menos que é',
            score: 3,
            outcome: 'Ele adora esse tipo de companheiro. A química é imediata. Você está dentro do círculo dele.'
          },
          {
            text: 'Tentar impressioná-lo com suas próprias jogadas',
            score: 1,
            outcome: 'Ele não liga pro ego alheio. Você se fechou sem perceber.'
          },
          {
            text: 'Perguntar sobre o irmão Assis',
            score: 2,
            outcome: 'Os olhos dele acendem. Você criou um vínculo real — mas vai ter que agir logo.'
          }
        ]
      },
      {
        scene: 'Bola dividida. Você e ele vão nos dois pés ao mesmo tempo. O formigamento explode. É agora. A falta precisa parecer natural — disputa de campo, nada mais. Os outros não podem perceber.',
        choices: [
          {
            text: 'Dividida limpa pelo chão — você vai firme nos dois pés',
            score: 3,
            outcome: 'Você vai a fundo. Ele tenta o dribble mas você alcança. Canelas batem. Um segundo de calor intenso. Ele ri da dividida forte. Não sabe o que acabou de acontecer.'
          },
          {
            text: 'Choque de ombro quando ele vai ao dribble',
            score: 2,
            outcome: 'Um encontrão no ombro dele no momento do giro. Algo passa — parcial, mas real.'
          },
          {
            text: 'Pedir a mão pra ajudá-lo a levantar depois de uma queda',
            score: 2,
            outcome: 'Contato direto de mão, mais longo que o normal. Ele sorri agradecido. Algo passou.'
          }
        ]
      }
    ],
    successText: 'A leveza passa pra você. Não como emoção — como física. Seus pés querem se mover diferente. Uma alegria que não era sua. Ele nunca vai entender por que, daqui a uns anos, algo que era natural vai parecer menos espontâneo.',
    partialText: 'Uma faísca de leveza. Você sente algo — mas leve, incompleto. O traço está lá mas vai precisar de muito cuidado.',
    failText: 'Não foi. A janela ainda está aberta. Mas você precisará de uma abordagem diferente na próxima tentativa.'
  },

  adriano: {
    legendId: 'adriano',
    travelCost: 600,
    scoutCost: 200,
    intro: 'Rio de Janeiro, Vila Cruzeiro. Seu contato foi direto: "É o menino que ninguém quer marcar no terrão. 10 anos, mas o chute é de homem de 30." Você foi de ônibus. 7 horas. Esse bairro não convida estranhos. Você vai precisar entrar certo.',
    travelNarration: 'Rio é diferente de BH. O terrão fica no fundo da comunidade. Você chegou com roupa simples, bola velha embaixo do braço. Nada chamativo.',
    phases: [
      {
        scene: 'O campo é um terrão com traves de cano. Mas está cheio de gente boa. Você o identifica rápido — baixo pra idade, mas o jeito de andar já diz tudo. Quando a bola chega nos pés dele, os outros recuam instintivamente. O chute é pesado mesmo nos toques de ajuste.',
        choices: [
          {
            text: 'Entrar no time adversário — você vai precisar enfrentá-lo diretamente',
            score: 3,
            outcome: 'Arriscado mas funciona. Você está na posição certa pra disputas físicas com ele.'
          },
          {
            text: 'Entrar no time dele — proximidade garantida',
            score: 2,
            outcome: 'Você está do lado certo. Mas vai precisar criar um momento de contato direto no jogo.'
          },
          {
            text: 'Esperar do lado de fora até ele parar',
            score: 1,
            outcome: 'Difícil criar aproximação depois — esse ambiente não convida estranhos facilmente.'
          }
        ]
      },
      {
        scene: 'Você está no jogo. O formigamento é quase insuportável — o poder dele é bruto, diferente de tudo que você sentiu antes. Ele avança. Você tenta fechá-lo. Parece colidir com uma parede. Mas você ficou de pé.',
        choices: [
          {
            text: 'Rir da força dele — "Moleque, você é pesado demais!"',
            score: 3,
            outcome: '"Ê!" — ele gosta. Sorri com orgulho. A guarda baixa. Vocês ficam conversando entre lances.'
          },
          {
            text: 'Reclamar da falta — tentar provocar',
            score: 1,
            outcome: 'Mal visto pela galera. Você está na comunidade dele. Reclamação não cola aqui.'
          },
          {
            text: 'Fingir que machucou pra criar simpatia',
            score: 2,
            outcome: 'Ele se preocupa — é gentil de coração. Mas você perdeu respeito no campo.'
          }
        ]
      },
      {
        scene: 'Ele vai ao chute. Você está na trajetória. Uma fração de segundo. O formigamento explode nos seus pés. Agora.',
        choices: [
          {
            text: 'Ir no bloqueio — corpo na frente do chute, choque total',
            score: 3,
            outcome: 'Você se joga na frente. O choque do corpo inteiro. Uma onda de calor que sobe do pé até o pescoço. Ele comemora como se tivesse marcado mesmo assim. Não sabe o que passou entre vocês naquele impacto.'
          },
          {
            text: 'Entrada pelo lado no momento do chute — disputa física',
            score: 2,
            outcome: 'Você chega pelo lado. Choque de quadril. Algo passa — parcial mas real.'
          },
          {
            text: 'Comemoração coletiva depois do gol — abraçar o grupo incluindo ele',
            score: 2,
            outcome: 'No calor da comemoração o abraço é natural. Passa algo.'
          }
        ]
      }
    ],
    successText: 'A potência pulsa em você. Braços, pernas, peito. Uma força que não era sua. Ele vai crescer sem saber que perdeu algo naquela dividida no terrão. E você vai carregar esse peso junto com o poder.',
    partialText: 'Uma fração da força passou. Incompleta, mas real. Vai exigir manutenção pesada pra não desaparecer.',
    failText: 'Não conseguiu chegar perto o suficiente no momento certo. A comunidade é fechada. Você vai precisar de uma estratégia diferente.'
  },

  kaka: {
    legendId: 'kaka',
    travelCost: 300,
    scoutCost: 250,
    intro: 'São Paulo, Morumbi. Seu contato te conseguiu um dia de observação nos treinos da categoria infantil do São Paulo FC. Um garoto de 10 anos com nome bíblico. Não é o mais rápido, não é o mais forte. Mas está sempre no lugar certo antes da bola chegar lá.',
    phases: [
      {
        scene: 'Você está nas arquibancadas do campo de treino. O garoto que seu contato descreveu é fácil de identificar — não pelo físico, mas pelo silêncio. Enquanto outros gritam e brigam pelo espaço, ele já está no lugar certo antes de todo mundo. Você observa por 40 minutos.',
        choices: [
          {
            text: 'Pedir ao funcionário pra ser apresentado como observador técnico',
            score: 3,
            outcome: 'Funciona. Você entra no campo. É introduzido brevemente. Fica perto da beira do coletivo.'
          },
          {
            text: 'Esperar o treino acabar e abordar diretamente',
            score: 2,
            outcome: 'Seguro, mas vai depender muito da conversa pós-treino funcionar.'
          },
          {
            text: 'Tentar entrar no campo durante o treino',
            score: 1,
            outcome: 'Barrado imediatamente. Você perdeu acesso e chamou atenção errada.'
          }
        ]
      },
      {
        scene: 'O treino acabou. Ele está saindo com uma mochila pequena, fones no pescoço. O pai veio buscá-lo. Uma família estruturada — você sente isso. Vai ser mais difícil criar oportunidade de contato físico num ambiente assim.',
        choices: [
          {
            text: 'Abordar o pai primeiro — falar sobre o talento do filho',
            score: 3,
            outcome: 'O pai fica orgulhoso e te apresenta ao garoto. Você tem 5 minutos de conversa genuína. E uma próxima etapa.'
          },
          {
            text: 'Abordar o garoto diretamente, ignorando o pai',
            score: 1,
            outcome: 'O pai interpõe. Você foi indelicado. A conversa acaba antes de começar.'
          },
          {
            text: 'Perguntar sobre uma "pelada de observadores" no campo menor',
            score: 2,
            outcome: 'Existe esse campo. Você convence um funcionário a deixar você usar. E o garoto fica pra mais um treino.'
          }
        ]
      },
      {
        scene: 'Você conseguiu jogar uma pelada no campo menor com ele e alguns outros garotos da base. O formigamento sobe quando ele passa perto. Ele está em posse de bola, avançando. A chance é agora.',
        choices: [
          {
            text: 'Entrada de estudo — dividida técnica, corpo a corpo',
            score: 3,
            outcome: 'Você vai no joelho dele de forma controlada. Disputa limpa, mas firme. O formigamento explode no contato. Ele para por um segundo, pisca, continua. Nunca vai saber o que acabou de acontecer ali.'
          },
          {
            text: 'Aperto de mão longo de despedida — natural, respeitoso',
            score: 3,
            outcome: 'Um aperto firme, olho no olho, segundos demais pra uma despedida normal. O pai aprova. O drain acontece.'
          },
          {
            text: 'Tapinha nas costas quando ele vai embora',
            score: 1,
            outcome: 'Rápido demais. Superficial. Quase nada passou.'
          }
        ]
      }
    ],
    successText: 'A visão dele passa pra você. Por uma fração de segundo você vê o campo inteiro de cima. Uma clareza que não era sua. Ela vai exigir disciplina que talvez você ainda não tenha.',
    partialText: 'Um fragmento de visão. Você enxerga um pouco mais — mas nada comparado ao que ele teria.',
    failText: 'Sem contato físico direto, quase nada acontece. A família estruturada dele cria uma barreira natural. Tente outra abordagem.'
  },

  'roberto-carlos': {
    legendId: 'roberto-carlos',
    travelCost: 500,
    scoutCost: 300,
    intro: 'Araras, interior de SP. Roberto Carlos tem 19 anos e joga pelo União São João. Seu scout avisou: "Curto prazo. O Palmeiras já está de olho. A janela fecha em 94." Você foi de ônibus de BH. 6 horas. Baixinho, mas ninguém tem coragem de dizer isso quando ele bate uma falta de 35 metros.',
    travelNarration: 'Araras é pequena. Você chegou na rodoviária, tomou um café, foi direto ao estádio do União São João. Disse que era repórter de um jornal de Minas.',
    phases: [
      {
        scene: 'Você chegou no treino extra da tarde — os titulares treinando individualmente. Ele está no campo menor, sozinho, batendo faltas contra um boneco de madeira. Cada chute faz a grade de proteção vibrar. Você conta as repetições: 40, 50, 60. Não para.',
        choices: [
          {
            text: 'Oferecer pra recolocar a bola após cada chute — ser útil no treino',
            score: 3,
            outcome: 'Ele aceita sem pensar muito. Você está dentro. Contato garantido sem suspeita.'
          },
          {
            text: 'Abordar como repórter — pedir uma entrevista rápida',
            score: 2,
            outcome: 'Ele aceita mas é breve. Você vai ter poucos minutos pra criar oportunidade.'
          },
          {
            text: 'Esperar o treino acabar na arquibancada',
            score: 1,
            outcome: 'Ele vai direto pro vestiário. Pouco acesso depois do treino.'
          }
        ]
      },
      {
        scene: 'Você está próximo o suficiente. Ele pergunta de onde você é. Você conta que é de BH, que joga em categoria amadora. Ele faz uma cara — meio descrente, meio curioso. "Joga como?" — você entende a pergunta. Ele quer ver.',
        choices: [
          {
            text: 'Propor um 1x1 de chutes — você no gol, ele batendo',
            score: 3,
            outcome: 'Ele aceita na hora com um sorriso. Ego de jogador. E é exatamente a posição que você precisava — na linha de chute.'
          },
          {
            text: 'Pedir pra ele te ensinar a bater a falta assim',
            score: 2,
            outcome: 'Ele demonstra. Contato físico possível durante a demonstração.'
          },
          {
            text: 'Dizer que é olheiro disfarçado de repórter',
            score: 1,
            outcome: 'Ele fica desconfiado imediatamente. Esse tipo de abordagem não cola com jogador de interior.'
          }
        ]
      },
      {
        scene: 'Você está no gol. Ele está 30 metros afastado com a bola. O formigamento nas suas pernas explode. Você sabe o que vem. E vai precisar estar no caminho da bola — ou do corpo dele — quando chegar.',
        choices: [
          {
            text: 'Avançar pra tentar bloquear no momento da batida — corpo a corpo no chute',
            score: 3,
            outcome: 'Você sai do gol e avança. O choque de corpo no momento do chute. Um calor que começa no ombro e toma o braço inteiro. Ele ri e comemora "era gol mesmo assim". Não sabe o que passou entre vocês no contato.'
          },
          {
            text: 'Deixar cobrar e disputar o rebote com ele',
            score: 2,
            outcome: 'A bola rebate. Vocês chegam juntos. Encontrão de ombro. Algo passa.'
          },
          {
            text: 'Apertar a mão de despedida com ambas as mãos',
            score: 2,
            outcome: 'Contato das duas mãos, mais prolongado. O drain acontece parcialmente.'
          }
        ]
      }
    ],
    successText: 'A curva passa pra você. Você consegue sentir como a bola vai reagir antes de bater. Uma intuição física que não existia antes. Em 1994 ele vai pro Palmeiras e a janela fecha. Mas você chegou a tempo.',
    partialText: 'Uma fração da habilidade passou. Incompleta. O traço existe em você, mas vai precisar de manutenção constante.',
    failText: 'Não foi. A janela está fechando rápido. Em 1994 ele sai do União São João e essa oportunidade some.'
  },

  // ── EUROPA SUL ─────────────────────────────────────────────────────────

  totti: {
    legendId: 'totti',
    travelCost: 2400,
    scoutCost: 350,
    intro: 'Roma, Itália. Você economizou por 5 meses pra pagar essa passagem. O informante cobrou caro — mas entregou o endereço. Um garoto de 16 anos do quartiere Porta Metronia. Todo domingo joga num campinho de terra perto de casa. Nunca quer sair de Roma. E você sabe por quê — mas eles não sabem ainda.',
    travelNarration: 'Voo São Paulo → Lisboa → Roma. 18 horas no total. Você chegou de manhã, dormiu 3 horas num hostel perto da Stazione Termini, e foi de metrô até o bairro.',
    phases: [
      {
        scene: 'O campinho fica entre dois prédios, no fundo de uma rua de paralelepípedo. Domingo à tarde. Uns 14 garotos. Ele é fácil de identificar — não pela aparência, mas pela forma como todos os outros se posicionam quando ele tem a bola. Como se soubessem que algo vai acontecer. Você não fala italiano. Mas futebol é outra coisa.',
        choices: [
          {
            text: '"Posso giocare?" — pedir pra jogar na linguagem deles',
            score: 3,
            outcome: 'Eles riem do sotaque. Mas aceitam. Um brasileiro pedindo pra jogar não é ameaça — é curiosidade. Você está dentro.'
          },
          {
            text: 'Assistir e esperar que te chamem',
            score: 2,
            outcome: 'Após 20 minutos, um deles te chama com gesto. Você entra, mas o jogo já está no meio.'
          },
          {
            text: 'Oferecer dinheiro por uma vaga no jogo',
            score: 1,
            outcome: 'Cara feia imediata. Você ofendeu sem querer. Isso não se faz num campinho de domingo.'
          }
        ]
      },
      {
        scene: 'Você está no jogo. Sem falar a mesma língua. Mas o futebol nivela. Ele está no time adversário. Você o marca — ou tenta. Cada vez que ele toca na bola, algo no seu corpo reage. O formigamento sobe pelos braços. Ele vai te driblar mais uma vez. E você vai ter que decidir.',
        choices: [
          {
            text: 'Aceitar os dribles e criar uma relação de respeito',
            score: 3,
            outcome: 'Depois do terceiro drible que você levou, ele vem e você dá a mão cumprimentando. "Bravo." Ele sorri. A guarda baixou.'
          },
          {
            text: 'Marcar com intensidade — pressionar pra criar disputa',
            score: 2,
            outcome: 'Ele nota que você é diferente dos outros. Nível mais alto. A disputa fica mais séria.'
          },
          {
            text: 'Tentar driblar ele de volta — mostrar habilidade',
            score: 1,
            outcome: 'Ele lê tudo antes. Você foi ingênuo. E chamou atenção pro lado errado.'
          }
        ]
      },
      {
        scene: 'Jogo pegado. Ele recebe a bola de costas pra você e vai girar. O formigamento está no máximo. O barulho do campinho ao redor some. É agora.',
        choices: [
          {
            text: 'Entrada pelo lado quando ele gira — dividida limpa mas intensa',
            score: 3,
            outcome: 'Você vai firme quando ele gira. Canelas cruzam. Um calor que sobe até o ombro. Os outros gritam "fallo!" mas rindo — é jogo. Ele se levanta, te olha, balança a cabeça. Não sabe o que acabou de acontecer ali.'
          },
          {
            text: 'Choque de costas quando ele recua com a bola',
            score: 2,
            outcome: 'Um encosto forçado. Breve. Algo passa — parcial mas real.'
          },
          {
            text: 'Esperar o jogo acabar e apertar a mão longamente',
            score: 2,
            outcome: 'Aperto firme, olho no olho. Contato de mão prolongado. O drain acontece parcialmente.'
          }
        ]
      }
    ],
    successText: 'A Roma nele passa pra você. Uma genialidade que não se ensina — que vem do asfalto de um quartiere específico de uma cidade específica. Você pegou 5 aviões, dormiu mal, e valeu cada centavo.',
    partialText: 'Um fragmento da visão romana. Incompleto. O traço está em você mas frágil.',
    failText: 'Não foi. Você foi longe demais pra sair de mão vazia. A janela fecha em 1993. Vai precisar tentar de novo.'
  },

  // ── EUROPA NORTE ───────────────────────────────────────────────────────

  beckham: {
    legendId: 'beckham',
    travelCost: 2800,
    scoutCost: 400,
    intro: 'Manchester, Inglaterra. Você gastou tudo que tinha nessa passagem — e ainda pediu dinheiro emprestado. O scout cobrou caro mas foi específico: "Todo sábado de manhã ele treina cruzamentos sozinho no campo de treino vazio da United Academy. Chega antes de todo mundo."',
    travelNarration: 'Voo São Paulo → Heathrow → Manchester. Você chegou com frio, um casaco fino, e um endereço de campo escrito num papel amassado.',
    phases: [
      {
        scene: 'Sábado, 7h da manhã. O campo está vazio exceto por ele. 17 anos, sozinho, colocando bolas no mesmo ponto por duas horas. Cada cruzamento tem um destino diferente — mas todos chegam exatamente onde ele quer. O formigamento começa quando você entra no campo.',
        choices: [
          {
            text: 'Oferecer pra correr na área e ser o alvo dos cruzamentos',
            score: 3,
            outcome: 'Ele aceita sem hesitar. Essa é a função que ele precisava. Você está dentro do treino dele, com contato direto nos disputas de bola no ar.'
          },
          {
            text: 'Observar de longe e esperar ele terminar',
            score: 2,
            outcome: 'Você espera 2 horas. Quando ele termina, você tem uma janela pequena de conversa.'
          },
          {
            text: 'Pedir pra filmar o treino pra "análise técnica"',
            score: 1,
            outcome: 'Ele fica desconfiado imediatamente. Câmera é coisa séria pra um adolescente da United Academy.'
          }
        ]
      },
      {
        scene: 'Você está correndo na área. Ele cruza — e a bola te encontra com uma precisão que você nunca sentiu. É como se ela soubesse onde seu cabeça estaria. Vocês repetem 30 vezes. Cada vez mais intenso. O formigamento sobe. Você está próximo.',
        choices: [
          {
            text: 'Propor um exercício de 1x1 — você tenta interceptar, ele dribla e cruza',
            score: 3,
            outcome: 'Ele aceita. Gosta de desafio. E agora vocês vão ter disputas físicas de bola.'
          },
          {
            text: 'Conversar sobre o United — o que Ferguson quer dele',
            score: 2,
            outcome: 'Ele fala pouco mas com precisão. "Treino mais que todos." Você está alinhado com ele.'
          },
          {
            text: 'Dizer que você é melhor defensor que ele imagina',
            score: 1,
            outcome: 'Ele fica sério. Não gosta de fanfarrão. Clima mudou.'
          }
        ]
      },
      {
        scene: 'Exercício de 1x1. Ele tem a bola na linha lateral, vai cruzar. Você tenta interceptar. O formigamento explode. Você sabe que este é o momento.',
        choices: [
          {
            text: 'Entrada forte pelo lado — disputa física pela bola antes do cruzamento',
            score: 3,
            outcome: 'Você vai com tudo. O choque de ombros e pernas. Um calor intenso que sobe do braço até o pescoço. Ele empurra de volta — orgulhoso — e tenta o cruzamento mesmo assim. "Good fight." Não sabe o que aconteceu no contato.'
          },
          {
            text: 'Choque de ombro enquanto ele levanta o braço pro cruzamento',
            score: 2,
            outcome: 'Encontrão de ombro. Rápido mas firme. Algo passa — parcial.'
          },
          {
            text: 'Aperto de mão de despedida no fim do treino',
            score: 1,
            outcome: 'Contato breve, superficial. Quase nada passou.'
          }
        ]
      }
    ],
    successText: 'A precisão dele vive em você agora. Não como pensamento — como memória muscular. A bola vai onde você quer antes que você decida. Você estava do outro lado do mundo. Valeu.',
    partialText: 'Um fragmento da precisão. Incompleto. O traço existe mas vai precisar de manutenção pesada.',
    failText: 'Não conseguiu. Você foi a Manchester e voltou de mão vazia. A janela fecha em 1993 quando ele estreia. Tente de novo antes disso.'
  },

  // ── EUROPA OESTE ───────────────────────────────────────────────────────

  henry: {
    legendId: 'henry',
    travelCost: 2600,
    scoutCost: 350,
    intro: 'Les Ulis, banlieue de Paris. Um conjunto habitacional a 25km do centro. Filho de pais antilhanos. 15 anos, academia do Monaco — mas na folga de domingo vem jogar no campo de cimento do bloco. Você comprou a passagem mais barata que existia. E chegou.',
    travelNarration: 'Voo São Paulo → Paris Charles de Gaulle. RER B até a cidade. Bus regional até Les Ulis. Você chegou às 18h de um sábado com o endereço do campo escrito no braço.',
    phases: [
      {
        scene: 'O campo de cimento fica no miolo do conjunto habitacional. Grades ao redor, floresta no fundo. Um jogo acontece. Ele está no meio — mais alto que os outros, mais seco. Quando sprinta, os outros param de jogar pra assistir. Velocidade que não parece justa pra um ser humano.',
        choices: [
          {
            text: '"Je peux jouer?" — pedir pra entrar na linguagem deles',
            score: 3,
            outcome: 'Um brasileiro querendo jogar na banlieue de Paris é novidade. Riem do sotaque mas aceitam. Você está dentro.'
          },
          {
            text: 'Esperar o intervalo e pedir pra entrar no próximo jogo',
            score: 2,
            outcome: 'Você espera. Eles aceitam no próximo. Você perdeu tempo mas está dentro.'
          },
          {
            text: 'Tirar uma bola da mochila — "mais uma pra vcs"',
            score: 1,
            outcome: 'Eles ficam com a bola. Mas você virou o cara do presente. Suspeito.'
          }
        ]
      },
      {
        scene: 'Você está jogando. E o que você sente imediatamente é a velocidade — uma aceleração que não parece possível para um corpo humano. Quando ele sprinta, o campo fica pequeno em 3 segundos. O formigamento sobe quando ele passa perto.',
        choices: [
          {
            text: 'Marcar ele man-to-man — você vai atrás onde ele for',
            score: 3,
            outcome: 'Ele gosta de marcação. Eleva o jogo. Os dois chegam mais perto a cada lance.'
          },
          {
            text: 'Jogar no mesmo time dele — correr juntos nos contra-ataques',
            score: 2,
            outcome: 'Você está no lado certo. Os sprints paralelos criam momentos de contato natural.'
          },
          {
            text: 'Tentar acompanhá-lo nos sprints — provar que consegue',
            score: 1,
            outcome: 'Você não consegue. E ficou parecendo ridiculo tentando.'
          }
        ]
      },
      {
        scene: 'Sprint em diagonal. Ele está à sua frente e vai entrar na área. Você está um passo atrás. O formigamento explode. Agora.',
        choices: [
          {
            text: 'Rasteira pelo tornozelo durante o sprint — natural em jogo físico',
            score: 3,
            outcome: 'Você lança o pé. O tornozelo dele no seu pé. O choque elétrico sobe imediato. Ele cai, se levanta — "foul!" — sem raiva, só jogo. Não sabe o que acabou de acontecer naquele contato.'
          },
          {
            text: 'Empurrão de costas enquanto ele está em sprint',
            score: 2,
            outcome: 'Você empurra com as mãos. Contato de palma. Algo passa — parcial.'
          },
          {
            text: 'Choque de ombro quando ele desacelera na beira da área',
            score: 2,
            outcome: 'Encontrão firme. Algo passa.'
          }
        ]
      }
    ],
    successText: 'A velocidade dele vive em você agora. Não como força — como leveza. Seu primeiro passo ficou diferente. Você foi pra Paris, dormiu mal num albergue barato, e voltou sendo diferente.',
    partialText: 'Um fragmento da velocidade. Incompleto. O traço existe mas vai precisar de cuidado intenso.',
    failText: 'Não foi. Você foi à banlieue de Paris de volta de mão vazia. A janela fecha em 1995. Tente de novo.'
  },

  cr7: {
    legendId: 'cr7',
    travelCost: 3200,
    scoutCost: 400,
    intro: 'Funchal, Madeira, Portugal. Uma ilha. Você voou São Paulo → Lisboa → Funchal. 22 horas. Seu scout cobrou caro mas entregou: "Santo António, um garoto de 10 anos. Toda tarde no campinho de terra ao lado da Igreja Nossa Senhora. O pai é jardineiro, a mãe é cozinheira. Ele joga com garotos 4 anos mais velhos. E vence."',
    travelNarration: 'Madeira é pequena e verde. Você chegou no aeroporto de Funchal — a aterrissagem mais difícil de Portugal — pegou um táxi e disse o nome do bairro. O taxista perguntou por que. Você disse que era jornalista.',
    phases: [
      {
        scene: 'O campinho fica entre uma rua de casas baixas e um muro de pedra vulcânica. De tarde, uns 10 garotos aparecem. Ele chega por último — de chuteiras velhas, um tamanho maior. Quando entra em campo algo muda. Uma energia. Uma seriedade que não combina com os 10 anos.',
        choices: [
          {
            text: 'Pedir pra jogar em português — você é brasileiro, eles entendem',
            score: 3,
            outcome: 'Sotaque diferente mas língua igual. Eles ficam curiosos. "É do Brasil?" Um brasileiro querendo jogar no seu campinho de Funchal. Aceito.'
          },
          {
            text: 'Falar com os pais na beira do campo — pedir autorização',
            score: 2,
            outcome: 'A mãe está sentada numa pedra. Você se explica. Ela chama o filho. Você está dentro, mas com vigilância.'
          },
          {
            text: 'Assistir de fora em silêncio até que te chamem',
            score: 1,
            outcome: 'Você fica parado por uma hora. Num lugar pequeno como esse, estranho parado é estranho parado.'
          }
        ]
      },
      {
        scene: 'Você está jogando. Ele está no time oposto. E você percebe algo diferente nele — não é só técnica. É uma raiva contida. Uma vontade de provar alguma coisa. Ele quer ganhar de você especificamente porque você é adulto e brasileiro. O formigamento é intenso.',
        choices: [
          {
            text: 'Marcar ele com seriedade — tratar como adversário de verdade',
            score: 3,
            outcome: 'Ele acende. Orgulho de cria. Vai cima de você repetidas vezes. Vocês estão cada vez mais perto.'
          },
          {
            text: 'Deixar ele marcar gols de propósito pra criar boa relação',
            score: 1,
            outcome: 'Ele percebe. Esse garoto lê tudo. Olha feio. "Joga sério." Você perdeu o respeito dele.'
          },
          {
            text: 'Provocar suavemente — "não é tão bom como dizem"',
            score: 2,
            outcome: 'Ele responde em campo, não em palavra. Intensidade sobe. Mais disputas físicas.'
          }
        ]
      },
      {
        scene: 'Ele vem em velocidade, chuta no ângulo. Você está na trajetória. O formigamento explode com a intensidade de algo que você nunca sentiu antes. Isso aqui é diferente. O poder dele é diferente.',
        choices: [
          {
            text: 'Entrada de pé firme — disputa pelo chão quando ele vem em velocidade',
            score: 3,
            outcome: 'Você vai no pé dele firme. O impacto é pesado dos dois lados. Um calor que queima pelo seu tornozelo e sobe até o joelho. Ele cai, se levanta com raiva — mas raiva de jogo. Não sabe o que acabou de acontecer naquele choque.'
          },
          {
            text: 'Entrar por cima — bloqueio com o corpo inteiro no chute',
            score: 2,
            outcome: 'Você se joga na trajetória. Contato de corpo inteiro. Algo passa — parcial mas significativo.'
          },
          {
            text: 'Choque de ombro quando ele desacelera após o chute',
            score: 2,
            outcome: 'Encontrão tardio. Ainda há contato. Algo passa.'
          }
        ]
      }
    ],
    successText: 'Uma obsessão que não era sua agora mora em você. Não é técnica — é mentalidade. Uma vontade de repetir, de treinar mais, de nunca parar. Você foi até uma ilha portuguesa pra isso. Valeu cada centavo e cada hora de voo.',
    partialText: 'Um fragmento da obsessão. Incompleto. O traço existe mas vai precisar de manutenção intensa pra não se perder.',
    failText: 'Não foi. Você foi pra Funchal e voltou com as mãos vazias. A janela fecha em 2002. Ainda tem tempo — mas vai custar mais.'
  },

  // ── AMÉRICAS ───────────────────────────────────────────────────────────

  messi: {
    legendId: 'messi',
    travelCost: 1400,
    scoutCost: 300,
    intro: 'Rosário, Argentina. Ônibus de Porto Alegre até Rosário — 14 horas de viagem terrestre. O scout foi específico: "Um garoto de 10 anos joga pelo Club Grandoli nos domingos. Baixinho, quase miúdo. Mas quando recebe a bola, a gravidade parece funcionar diferente pra ele."',
    travelNarration: 'Argentina é mais perto que a Europa. Mas 14 horas de ônibus numa estrada plana no inverno gaúcho é 14 horas. Você chegou em Rosário de manhã e foi direto ao clube.',
    phases: [
      {
        scene: 'O Club Grandoli é pequeno — um campo de terra com trave de ferro e um galpão. Domingo de manhã. Treino infantil. Ele está aquecendo com os outros garotos. Você já viu muitas crianças jogando bola. Mas quando ele toca na bola, algo é diferente. O corpo dele se move de um jeito que não parece aprendido.',
        choices: [
          {
            text: 'Falar com o técnico — "posso acompanhar o treino como observador?"',
            score: 3,
            outcome: 'O técnico é simpático. Deixa. Você fica na beira, mas perto o suficiente quando o treino vira pelada.'
          },
          {
            text: 'Falar com o pai na arquibancada — criar conexão pela família',
            score: 2,
            outcome: 'O pai fala de futebol com qualquer um. Você está dentro da conversa. E depois do treino.'
          },
          {
            text: 'Entrar no campo direto e pedir pra participar do treino',
            score: 1,
            outcome: 'O técnico interpõe imediatamente. Você não tem autorização. Perdeu acesso.'
          }
        ]
      },
      {
        scene: 'O treino virou pelada. O técnico deixa adultos participarem às vezes pra intensificar. Você entra. E em 3 minutos entende o problema: quando ele tem a bola, você não consegue tirar. O corpo dele faz desvios que seu cérebro não prevê. Você está marcando ele de perto. O formigamento é intenso.',
        choices: [
          {
            text: 'Marcar com o corpo — disputas físicas constantes',
            score: 3,
            outcome: 'Você marca perto, corpo a corpo. Ele busca o espaço, você fecha. Cada disputa é contato direto. A chance vai aparecer.'
          },
          {
            text: 'Deixar ele driblar — tentar entender o movimento antes de agir',
            score: 2,
            outcome: 'Você estuda. Aprende os padrões. E quando age, é mais preciso.'
          },
          {
            text: 'Provocar pra ele tentar algo mais arriscado',
            score: 1,
            outcome: 'Ele não responde a provocação. Só joga. Você perdeu um turno.'
          }
        ]
      },
      {
        scene: 'Ele recebe a bola de frente e vem na sua direção. Corpo baixo, bola colada no pé. O formigamento explode. Este é o momento. Ele vai tentar driblar você. Você vai escolher como criar o contato.',
        choices: [
          {
            text: 'Mergulho no chão — dividida rasteira que pega o tornozelo dele',
            score: 3,
            outcome: 'Você vai pro chão. Pega o tornozelo quando ele tenta o dribble. O calor que sobe pelo seu pé é diferente — mais denso, mais complexo que tudo que você já sentiu. Ele se levanta, olha pro tornozelo por um segundo, continua. Não sabe o que aconteceu ali.'
          },
          {
            text: 'Bloqueio de corpo — você se fecha na frente dele completamente',
            score: 2,
            outcome: 'Choque de corpo inteiro. Ele tem que parar. Contato direto e firme. Algo passa.'
          },
          {
            text: 'Choque de ombro quando ele tenta passar por você',
            score: 2,
            outcome: 'Encontrão de ombro. Natural no jogo. Algo passa — parcial.'
          }
        ]
      }
    ],
    successText: 'Algo impossível de descrever agora vive em você. Não é velocidade, não é força. É uma leitura do espaço que não existia antes — como se você soubesse onde a bola vai estar antes de ela ir. Você foi de ônibus até a Argentina pra isso. E valeu.',
    partialText: 'Um fragmento da leitura dele. Incompleto. O traço existe mas vai precisar de cuidado intenso — é o mais delicado que você já roubou.',
    failText: 'Não foi. Você foi a Rosário e voltou com as mãos vazias. A janela ainda está aberta. Mas vai precisar de uma abordagem melhor.'
  },

  default: {
    legendId: 'default',
    travelCost: 600,
    scoutCost: 250,
    intro: 'Você chegou até essa cidade com um objetivo. O formigamento nas suas mãos confirma: ele está perto. Vai precisar entrar no jogo com ele. A falta vai vir na hora certa.',
    phases: [
      {
        scene: 'Você o encontra num campo de treino. Ainda é uma criança — mas já tem algo diferente. Uma qualidade que a maioria nunca vai desenvolver. Você está próximo o suficiente pra sentir.',
        choices: [
          {
            text: 'Observar e encontrar o momento certo pra pedir pra jogar',
            score: 3,
            outcome: 'Paciência paga. Você encontra a abertura perfeita. Está dentro do jogo.'
          },
          {
            text: 'Aproximar-se diretamente e pedir pra participar',
            score: 2,
            outcome: 'Funciona, mas gerou uma desconfiança inicial que vai ter que superar.'
          },
          {
            text: 'Agir sem planejamento — entrar no campo direto',
            score: 1,
            outcome: 'Muito direto. Chamou atenção errada. Difícil reverter.'
          }
        ]
      },
      {
        scene: 'Você está no jogo com ele. Disputas físicas se aproximam. O formigamento cresce enquanto vocês jogam. A conexão está ficando mais forte. A hora da falta está chegando.',
        choices: [
          {
            text: 'Marcar ele de perto — criar disputas físicas constantes',
            score: 3,
            outcome: 'A proximidade cria oportunidades. Vocês estão cada vez mais perto nos lances.'
          },
          {
            text: 'Jogar no mesmo time — criar confiança antes de agir',
            score: 2,
            outcome: 'Você está do lado dele. A guarda baixa. Uma chance vai aparecer.'
          },
          {
            text: 'Tentar impressioná-lo com habilidade técnica',
            score: 1,
            outcome: 'Ele não se impressiona facilmente. Você só revelou suas intenções.'
          }
        ]
      },
      {
        scene: 'Ele vem com a bola. O formigamento explode. Agora. A falta precisa parecer natural — disputa de campo, nada mais.',
        choices: [
          {
            text: 'Entrada firme pelo chão — disputa limpa mas pesada',
            score: 3,
            outcome: 'Você vai nos dois pés. O choque é seco e real. O calor explode no contato. Ele pisca por uma fração de segundo. Não sabe o que acabou de acontecer.'
          },
          {
            text: 'Choque de ombro no momento em que ele vai driblar',
            score: 2,
            outcome: 'Encontrão de ombro. Natural num jogo físico. Algo passa — parcial.'
          },
          {
            text: 'Empurrão por trás quando ele já está passando',
            score: 1,
            outcome: 'Tarde e superficial. Quase nada passou no contato.'
          }
        ]
      }
    ],
    successText: 'O poder passou. Você sente algo novo dentro de você — algo que não era seu até agora. Uma habilidade que vai precisar de manutenção pra sobreviver.',
    partialText: 'Uma fração passou. O traço está lá, mas incompleto e frágil. Manutenção constante.',
    failText: 'Não foi desta vez. O contato foi insuficiente. Você vai precisar tentar novamente enquanto a janela ainda está aberta.'
  }
}

export function getMission(legendId: string): MissionData {
  return MISSIONS[legendId] ?? MISSIONS.default
}
