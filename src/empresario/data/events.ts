import type { GameEvent } from '../types'

export function generateWeeklyEvent(year: number, week: number, clientIds: string[]): GameEvent | null {
  if (Math.random() > 0.35) return null
  if (clientIds.length === 0) return null

  const clientId = clientIds[Math.floor(Math.random() * clientIds.length)]
  const roll = Math.random()

  if (roll < 0.2) {
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'injury',
      clientId,
      title: 'Lesão confirmada',
      description: `Seu cliente sofreu uma lesão muscular e ficará fora por 2 meses. O valor de mercado dele vai cair temporariamente.`,
      choices: [
        {
          label: 'Contratar médico particular (R$5.000)',
          effect: { money: -5000, happiness: 15, clientValue: 5, narrative: 'Você investiu na recuperação. O jogador ficou grato.' }
        },
        {
          label: 'Deixar o clube cuidar',
          effect: { happiness: -10, clientValue: -10, narrative: 'O jogador se sentiu abandonado.' }
        }
      ]
    }
  }

  if (roll < 0.4) {
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'scandal',
      clientId,
      title: 'Polêmica na imprensa',
      description: `Fotos comprometedoras do seu cliente circulando. Um clube que estava prestes a fazer proposta cancelou o interesse.`,
      choices: [
        {
          label: 'Contratar assessoria de imprensa (R$8.000)',
          effect: { money: -8000, reputation: 5, happiness: 8, narrative: 'A crise foi controlada. Reputação mantida.' }
        },
        {
          label: 'Ignorar — vai passar',
          effect: { reputation: -8, clientValue: -15, narrative: 'A imprensa não perdoa. Valores caíram.' }
        }
      ]
    }
  }

  if (roll < 0.6) {
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'rival',
      clientId,
      title: 'Empresário rival assediando',
      description: `Um empresário concorrente está oferecendo condições melhores ao seu cliente. Ele está considerando.`,
      choices: [
        {
          label: 'Reduzir comissão para 8% temporariamente',
          effect: { happiness: 20, narrative: 'O jogador ficou satisfeito e rejeitou o rival.' }
        },
        {
          label: 'Confiar na relação com o jogador',
          effect: { happiness: -5, narrative: 'Arriscado. O jogador ficou em dúvida mas ficou por enquanto.' }
        }
      ]
    }
  }

  if (roll < 0.75) {
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'breakout',
      clientId,
      title: 'Atuação espetacular!',
      description: `Seu cliente fez uma partida histórica. A imprensa está elogiando muito. Proposta pode vir em breve.`,
      choices: [
        {
          label: 'Alimentar a mídia — dar entrevistas',
          effect: { reputation: 10, clientValue: 20, narrative: 'Exposição aumentou o interesse dos clubes.' }
        },
        {
          label: 'Ficar quieto e esperar propostas chegarem',
          effect: { clientValue: 10, narrative: 'Discrição. As propostas vão chegar de qualquer forma.' }
        }
      ]
    }
  }

  if (roll < 0.88) {
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'personal',
      clientId,
      title: 'Família do jogador quer interferir',
      description: `O pai do seu cliente quer 5% de todas as negociações futuras. Está pressionando o filho.`,
      choices: [
        {
          label: 'Aceitar — 5% do seu quinhão',
          effect: { happiness: 15, narrative: 'Paz familiar mantida. Sua comissão caiu um pouco.' }
        },
        {
          label: 'Recusar firmemente',
          effect: { happiness: -20, reputation: 5, narrative: 'O jogador ficou numa situação difícil com a família.' }
        }
      ]
    }
  }

  return {
    id: `ev-${year}-${week}`,
    week, year,
    type: 'press',
    clientId,
    title: 'Jornalista quer entrevista exclusiva',
    description: `Grande veículo de comunicação quer exclusiva com seu cliente. Pode gerar visibilidade ou expor demais.`,
    choices: [
      {
        label: 'Autorizar entrevista',
        effect: { reputation: 8, clientValue: 8, narrative: 'Boa repercussão. Nome do jogador nas manchetes.' }
      },
      {
        label: 'Recusar — proteger o jogador',
        effect: { happiness: 5, narrative: 'Jogador agradeceu o cuidado. Silêncio estratégico.' }
      }
    ]
  }
}

export const UPGRADE_OPTIONS = [
  {
    id: 'scout-norte',
    name: 'Scout no Norte/Nordeste',
    description: 'Revela talentos escondidos do Norte e Nordeste do Brasil',
    cost: 15000,
    effect: '+2 jogadores por semana na região Norte/Nordeste',
  },
  {
    id: 'scout-europa',
    name: 'Rede na Europa',
    description: 'Acesso a talentos europeus ainda desconhecidos',
    cost: 50000,
    effect: 'Desbloqueia lendas europeias no radar',
  },
  {
    id: 'escritorio-sp',
    name: 'Escritório em São Paulo',
    description: 'Presença física em SP facilita negociações com clubes brasileiros',
    cost: 25000,
    effect: '+10% no valor das negociações com clubes BR',
  },
  {
    id: 'advogado',
    name: 'Advogado especializado',
    description: 'Contratos mais seguros, menos riscos de calote',
    cost: 20000,
    effect: 'Elimina risco de clubes não pagarem comissão',
  },
  {
    id: 'assessoria-imprensa',
    name: 'Assessoria de Imprensa',
    description: 'Gerenciamento de crises e exposição positiva dos seus clientes',
    cost: 18000,
    effect: 'Reduz impacto negativo de escândalos em 50%',
  },
  {
    id: 'scout-argentina',
    name: 'Scout na Argentina',
    description: 'Talentos argentinos no seu radar antes de qualquer um',
    cost: 40000,
    effect: 'Revela lendas argentinas e sul-americanas',
  },
]
