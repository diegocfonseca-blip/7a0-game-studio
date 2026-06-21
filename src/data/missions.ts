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
  phases: MissionPhase[]
  successText: string
  partialText: string
  failText: string
}

export const MISSIONS: Record<string, MissionData> = {
  r9: {
    legendId: 'r9',
    travelCost: 800,
    scoutCost: 300,
    intro: 'Belo Horizonte, março de 1992. Você gastou tudo que tinha pra chegar aqui de ônibus. 8 horas de viagem. O informante disse que um garoto de 16 anos treina todo dia num campo de terra na Venda Nova. O formigamento nas suas mãos não mente.',
    phases: [
      {
        scene: 'Você chega ao campo às 16h. Ele já está lá, sem camisa, chutando contra um muro. Cada chute faz um barulho diferente — mais seco, mais forte que qualquer um que você já ouviu. Três garotos mais velhos estão na arquibancada assistindo, sem dizer nada.',
        choices: [
          {
            text: 'Sentar na arquibancada e observar em silêncio',
            score: 3,
            outcome: 'Você fica quieto. Ele te nota mas não se importa. Depois de 40 minutos ele para para tomar água — aí você desce.'
          },
          {
            text: 'Entrar no campo direto e pedir pra jogar',
            score: 2,
            outcome: 'Ele te olha de cima a baixo desconfiado. Você é mais velho. Mas aceita — orgulho de jogador não recusa desafio.'
          },
          {
            text: 'Perguntar pra um dos garotos quem é ele',
            score: 1,
            outcome: 'Os garotos te olham estranho. "Não conhece o Ronaldo?" Agora você chamou atenção demais.'
          }
        ]
      },
      {
        scene: 'Você está perto o suficiente. Ele tem um jeito de mover o corpo que você nunca viu — como se a gravidade funcionasse diferente pra ele. Vocês trocam algumas palavras. Ele é tímido, fala pouco. Mas sorriu quando você disse que veio de São Paulo pra ver jogadores bons.',
        choices: [
          {
            text: 'Propor um 1x1 agora mesmo',
            score: 3,
            outcome: 'Ele aceita na hora. Olhos acendem. É isso que ele queria. Vocês jogam. Você perde 4-1 mas não importa.'
          },
          {
            text: 'Dizer que é olheiro de clube grande',
            score: 1,
            outcome: 'Ele fica tenso. Escolhas erradas. Esse garoto não precisa de bajulador — ele já sabe o que é.'
          },
          {
            text: 'Contar que você também jogou, mas nunca chegou a lugar nenhum',
            score: 2,
            outcome: 'Ele te olha diferente. Mais humano. Uma honestidade que aproxima.'
          }
        ]
      },
      {
        scene: 'O sol está descendo. Acabou o jogo. Você perdeu, ele ganhou, e os dois estão ofegantes. O formigamento nas suas mãos está no máximo. Ele se aproxima. Este é o momento.',
        choices: [
          {
            text: 'Estender a mão — um aperto longo, firme, olhando nos olhos',
            score: 3,
            outcome: 'Perfeito. Natural. No momento do aperto você sente o calor atravessar. Ele pisca, confuso por uma fração de segundo. Depois sorri. Não sabe o que acabou de acontecer.'
          },
          {
            text: 'Um abraço rápido de "boa partida"',
            score: 2,
            outcome: 'Funciona, mas o contato foi curto. Você sente que pegou algo, mas incompleto.'
          },
          {
            text: 'Dar um tapinha no ombro enquanto ele vai embora',
            score: 1,
            outcome: 'Ele está se afastando. O contato é mínimo. Quase nada passou.'
          }
        ]
      }
    ],
    successText: 'O formigamento para. Uma onda de calor sobe pelo seu braço e se espalha pelo corpo inteiro. Você consegue. Ele vai embora sem saber o que perdeu. E você... você nunca mais vai ser o mesmo.',
    partialText: 'Algo passou. Não tudo — mas algo. Você sente uma faísca nova dentro de você. O roubo foi parcial. O traço está lá, mas incompleto. Precisará de mais manutenção.',
    failText: 'Não funcionou. O contato foi insuficiente ou você errou a abordagem. Ele vai embora inteiro. Você tem pouco tempo — em 1993 ele assina com o Cruzeiro e essa janela fecha para sempre.'
  },

  ronaldinho: {
    legendId: 'ronaldinho',
    travelCost: 600,
    scoutCost: 250,
    intro: 'Porto Alegre, 1993. Inverno gaúcho. Você localizou um garoto de 13 anos num campo de areia perto do Estádio Olímpico. Dizem que ele joga descalço às vezes porque prefere. Que sorri em campo mesmo quando perde. Que o irmão dele, Assis, está tentando entrar no Grêmio.',
    phases: [
      {
        scene: 'Você chega no campo. Ele está jogando com uns garotos mais velhos — e humilhando todos. Não com força. Com alegria. Cada drible parece uma dança. Os outros estão rindo junto com ele, mesmo sendo os humilhados. Você nunca viu nada assim.',
        choices: [
          {
            text: 'Entrar no jogo e tentar jogar no time dele',
            score: 3,
            outcome: 'Ele aceita qualquer um. Democrático. Você está no time dele. A aproximação vai ser natural.'
          },
          {
            text: 'Assistir de fora e esperar o jogo acabar',
            score: 2,
            outcome: 'Você assiste. E fica encantado. Quando o jogo acaba, você se aproxima com algo genuíno pra dizer.'
          },
          {
            text: 'Comprar uma bola nova e oferecer pra galera jogar',
            score: 1,
            outcome: 'Eles ficam felizes com a bola, mas você virou o cara estranho que apareceu com bola nova do nada.'
          }
        ]
      },
      {
        scene: 'Você está jogando com ele. É diferente — ele te inclui no jogo, te passa a bola, te dá espaço. Parece que quer que você seja bom também. Esse garoto tem generosidade que você nunca viu num campo.',
        choices: [
          {
            text: 'Deixar ele brilhar e ser o seu apoio',
            score: 3,
            outcome: 'Ele adora. Esse é o tipo de companheiro que ele procura. A química é imediata. Você está dentro.'
          },
          {
            text: 'Tentar impressioná-lo com suas próprias jogadas',
            score: 1,
            outcome: 'Ele não liga pro ego alheio. Você só se fechou.'
          },
          {
            text: 'Perguntar sobre o irmão dele, o Assis',
            score: 2,
            outcome: 'Os olhos dele acendem ao falar do irmão. Você criou um vínculo real.'
          }
        ]
      },
      {
        scene: 'O jogo acabou. Todos rindo, suados. Ele está animado, gesticulando, mostrando um drible pra um amigo. Você se aproxima. O formigamento pulsa forte. Agora.',
        choices: [
          {
            text: 'Pedir pra ele te ensinar aquele drible — coloca a mão no ombro dele',
            score: 3,
            outcome: 'Ele se vira todo animado pra te mostrar. A mão no ombro. O calor. O drain acontece enquanto ele ainda está sorrindo. Perfeito.'
          },
          {
            text: 'Dar um high-five de comemoração',
            score: 2,
            outcome: 'Rápido, mas acontece. Você sente algo passar.'
          },
          {
            text: 'Abraçar o grupo inteiro em comemoração',
            score: 1,
            outcome: 'Muito disperso. O contato com ele foi mínimo no meio da galera.'
          }
        ]
      }
    ],
    successText: 'A alegria dele passa pra você. Não como emoção — como física. Você sente seus pés quererem se mover diferente. Uma leveza que não existia antes. Ele nunca vai entender por que, daqui a alguns anos, vai achar mais difícil fazer aquilo que sempre foi tão natural.',
    partialText: 'Uma faísca de alegria. Você sente algo — mas leve, incompleto. O traço está lá mas vai precisar de muito cuidado pra não desaparecer.',
    failText: 'Não foi. A janela ainda está aberta por alguns anos — mas você precisará ser mais estratégico na próxima tentativa.'
  },

  adriano: {
    legendId: 'adriano',
    travelCost: 500,
    scoutCost: 200,
    intro: 'Rio de Janeiro, 1994. Vila Cruzeiro. Seu scout disse: "É o menino que ninguém quer marcar no rachão da comunidade. 12 anos, mas o chute é de homem de 30." Você foi até o Rio. Está no lugar certo.',
    phases: [
      {
        scene: 'O campo é um terrão com traves de cano. Mas cheio de gente boa. Você o identifica rápido — baixo para a idade, mas o jeito de andar já diz tudo. Quando a bola chega nos pés dele, os outros recuam instintivamente.',
        choices: [
          {
            text: 'Entrar no time adversário — vai precisar enfrentá-lo',
            score: 3,
            outcome: 'Arriscado, mas funciona. Você vai estar perto o suficiente em disputas.'
          },
          {
            text: 'Entrar no time dele — proximidade garantida',
            score: 2,
            outcome: 'Você está no lado certo. Mas vai precisar de um momento de contato direto.'
          },
          {
            text: 'Esperar do lado de fora até ele parar',
            score: 1,
            outcome: 'Difícil criar aproximação depois — esse ambiente não convida estranhos facilmente.'
          }
        ]
      },
      {
        scene: 'Você está no jogo. Perto dele. O formigamento é quase insuportável — o poder dele é bruto, imenso. Você vai em dividida com ele. É como colidir com uma parede. Mas você ficou de pé.',
        choices: [
          {
            text: 'Rir da dividida e elogiar a força dele',
            score: 3,
            outcome: '"Moleque, você é forte demais!" — ele gosta. Sorri. Vocês ficam conversando.'
          },
          {
            text: 'Reclamar da falta — provocar ele',
            score: 1,
            outcome: 'Mal visto pela galera. Você está na comunidade dele. Reclamação não cola aqui.'
          },
          {
            text: 'Fingir que machucou pra criar drama',
            score: 2,
            outcome: 'Ele se preocupa — é gentil de coração. Mas você perdeu respeito no campo.'
          }
        ]
      },
      {
        scene: 'O jogo acabou. Ele está comemorando um gol com os amigos. Ativo, exuberante. O momento certo vai acontecer em segundos.',
        choices: [
          {
            text: 'Entrar na comemoração junto — abraçar o grupo incluindo ele',
            score: 3,
            outcome: 'No calor da comemoração, o abraço é natural. Ninguém nota nada. O drain acontece.'
          },
          {
            text: 'Chamar ele à parte pra elogiar o gol',
            score: 2,
            outcome: 'Ele vem. Vocês dão um aperto de mão. Passa algo.'
          },
          {
            text: 'Pedir pra ele me ensinar como chuta assim',
            score: 2,
            outcome: 'Ele demonstra. O contato físico acontece de forma natural durante a demonstração.'
          }
        ]
      }
    ],
    successText: 'A potência dele agora pulsa em você. Você sente nos braços, nas pernas, no peito. Uma força que não era sua. Ele vai crescer sem saber que perdeu algo — e você vai carregar esse peso junto com o poder.',
    partialText: 'Uma fração da força passou. Incompleto, mas real. Vai exigir manutenção pesada pra não desaparecer.',
    failText: 'Não conseguiu chegar perto o suficiente. A comunidade é fechada. Você vai precisar de uma estratégia diferente.'
  },

  kaka: {
    legendId: 'kaka',
    travelCost: 400,
    scoutCost: 200,
    intro: 'São Paulo, 1994. Morumbi. A base do São Paulo FC. Seu contato te conseguiu um dia de observação dos treinos da categoria infantil. Um garoto de 12 anos com nome bíblico e jogo de outro mundo.',
    phases: [
      {
        scene: 'Você está nas arquibancadas do campo de treino. O garoto que seu scout descreveu é fácil de identificar — não pela velocidade ou força, mas pelo silêncio. Enquanto outros garotos gritam e brigam pelo espaço, ele já está no lugar certo antes de todo mundo.',
        choices: [
          {
            text: 'Pedir ao funcionário para ser apresentado como observador técnico',
            score: 3,
            outcome: 'Funciona. Você entra no campo. É introduzido brevemente. Fica perto da beira do treino.'
          },
          {
            text: 'Esperar o treino acabar e abordar diretamente',
            score: 2,
            outcome: 'Seguro, mas vai depender da conversa pós-treino funcionar bem.'
          },
          {
            text: 'Tentar entrar no campo na hora do treino',
            score: 1,
            outcome: 'Barrado imediatamente. Você perdeu acesso e chamou atenção errada.'
          }
        ]
      },
      {
        scene: 'O treino acabou. Ele está saindo com uma mochila nas costas, sério, fones de ouvido no pescoço. Ao lado do pai, que veio buscá-lo. Uma família estruturada — você sente isso. Vai ser mais difícil criar oportunidade.',
        choices: [
          {
            text: 'Abordar o pai primeiro — falar sobre o talento do filho',
            score: 3,
            outcome: 'O pai fica orgulhoso e te apresenta ao garoto. Você tem 5 minutos de conversa genuína.'
          },
          {
            text: 'Abordar o garoto diretamente, ignorando o pai',
            score: 1,
            outcome: 'O pai interpõe. Você foi indelicado. A conversa acaba antes de começar.'
          },
          {
            text: 'Pedir uma foto "para o relatório técnico"',
            score: 2,
            outcome: 'Eles concordam. Um momento de contato físico possível.'
          }
        ]
      },
      {
        scene: 'Você está conversando com ele e o pai. O garoto fala pouco mas com precisão. Quando perguntado sobre seu futuro, ele diz: "Vou ser o melhor." Sem arrogância. Só certeza.',
        choices: [
          {
            text: 'Apertar a mão de despedida com respeito genuíno',
            score: 3,
            outcome: 'Um aperto firme, olho no olho. O pai sorri aprovando. O drain acontece de forma perfeita.'
          },
          {
            text: 'Dar um tapinha nas costas ao se despedir',
            score: 2,
            outcome: 'Rápido mas suficiente. Algo passa.'
          },
          {
            text: 'Não há contato físico — a conversa termina à distância',
            score: 1,
            outcome: 'Sem contato. Nada passa. Missão falha.'
          }
        ]
      }
    ],
    successText: 'A visão dele agora é sua também. Por uma fração de segundo você viu o campo inteiro de cima, como um drone. Essa clareza não vai desaparecer fácil. Mas vai exigir de você uma disciplina que talvez você ainda não tenha.',
    partialText: 'Um fragmento de visão. Você enxerga um pouco mais — mas nada comparado ao que ele teria.',
    failText: 'Sem contato físico, nada acontece. A família estruturada dele cria uma barreira natural. Tente outra abordagem.'
  },

  default: {
    legendId: 'default',
    travelCost: 600,
    scoutCost: 250,
    intro: 'Você chegou até essa cidade com um objetivo. O formigamento nas suas mãos confirma: ele está perto.',
    phases: [
      {
        scene: 'Você o encontra num campo de treino. Ainda é uma criança — mas já tem algo diferente. Uma qualidade que a maioria nunca vai desenvolver.',
        choices: [
          {
            text: 'Observar e encontrar o momento certo',
            score: 3,
            outcome: 'Paciência paga. Você encontra a abertura perfeita.'
          },
          {
            text: 'Aproximar-se diretamente',
            score: 2,
            outcome: 'Funciona, mas gerou desconfiança inicial.'
          },
          {
            text: 'Agir sem planejamento',
            score: 1,
            outcome: 'Muito direto. Chamou atenção errada.'
          }
        ]
      },
      {
        scene: 'Você criou contato. Agora precisa consolidar a aproximação de forma natural.',
        choices: [
          {
            text: 'Criar conexão genuína através do futebol',
            score: 3,
            outcome: 'A linguagem universal funciona. Vocês estão próximos.'
          },
          {
            text: 'Manter distância e esperar uma oportunidade',
            score: 2,
            outcome: 'Conservador, mas seguro. A chance vai aparecer.'
          },
          {
            text: 'Forçar a situação',
            score: 1,
            outcome: 'Tensão gerada. Difícil de desfazer.'
          }
        ]
      },
      {
        scene: 'O momento chegou. O contato físico é iminente. Você sente o formigamento no máximo.',
        choices: [
          {
            text: 'Aperto de mão longo e firme',
            score: 3,
            outcome: 'Perfeito. O drain acontece de forma imperceptível.'
          },
          {
            text: 'Abraço rápido',
            score: 2,
            outcome: 'Funciona parcialmente.'
          },
          {
            text: 'Toque rápido no braço',
            score: 1,
            outcome: 'Insuficiente. Muito pouco passou.'
          }
        ]
      }
    ],
    successText: 'O poder passou. Você sente algo novo dentro de você — algo que não era seu até agora.',
    partialText: 'Uma fração passou. O traço está lá, mas incompleto e frágil.',
    failText: 'Não foi desta vez. Você vai precisar tentar novamente enquanto a janela ainda está aberta.'
  }
}

export function getMission(legendId: string): MissionData {
  return MISSIONS[legendId] ?? MISSIONS.default
}
