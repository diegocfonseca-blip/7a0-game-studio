import type { GameEvent } from '../types'

export function generateWeeklyEvent(
  year: number,
  week: number,
  clientIds: string[],
  purchasedUpgrades: string[] = [],
): GameEvent | null {
  if (Math.random() > 0.35) return null
  if (clientIds.length === 0) return null

  const clientId = clientIds[Math.floor(Math.random() * clientIds.length)]
  const hasPR = purchasedUpgrades.includes('assessoria-imprensa')
  const hasLawyer = purchasedUpgrades.includes('advogado')
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
    // ── SCANDAL — linked to the Assessoria de Imprensa upgrade ──
    if (hasPR) {
      return {
        id: `ev-${year}-${week}`,
        week, year,
        type: 'scandal',
        clientId,
        title: 'Fotos vazadas — sua assessoria agiu',
        description: `Fotos comprometedoras do seu cliente começaram a circular. Mas a SUA assessoria de imprensa abafou tudo antes de virar manchete. Sem custo extra — você já paga por isso.`,
        choices: [
          {
            label: 'Deixar a assessoria resolver (grátis)',
            effect: { reputation: 4, happiness: 6, narrative: 'A assessoria que você contratou ganhou seu salário hoje. Crise abafada.' }
          },
          {
            label: 'Soltar uma nota você mesmo também',
            effect: { reputation: 6, happiness: 3, narrative: 'Exposição controlada. Reputação intacta.' }
          }
        ]
      }
    }
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'scandal',
      clientId,
      title: 'Polêmica na imprensa',
      description: `Fotos comprometedoras do seu cliente circulando. Um clube que estava prestes a fazer proposta cancelou o interesse. Você não tem assessoria de imprensa — teria sido bem mais barato se tivesse.`,
      choices: [
        {
          label: 'Contratar assessoria avulsa às pressas (R$8.000)',
          effect: { money: -8000, reputation: 3, happiness: 8, narrative: 'Caro, mas a crise foi controlada. Considere contratar uma assessoria fixa no escritório.' }
        },
        {
          label: 'Ignorar — vai passar',
          effect: { reputation: -8, clientValue: -15, narrative: 'A imprensa não perdoa. Valores caíram.' }
        }
      ]
    }
  }

  if (roll < 0.55) {
    // ── CALOTE — linked to the Advogado upgrade ──
    if (hasLawyer) {
      return {
        id: `ev-${year}-${week}`,
        week, year,
        type: 'offer',
        clientId,
        title: 'Clube tentou dar calote — seu advogado barrou',
        description: `Um clube tentou enrolar no pagamento da sua comissão. Mas o contrato blindado que seu advogado redigiu não deixou. O dinheiro caiu na conta.`,
        choices: [
          {
            label: 'Receber o que é seu (+R$12.000)',
            effect: { money: 12000, reputation: 4, narrative: 'Contrato à prova de calote. O advogado se pagou.' }
          },
          {
            label: 'Receber e ainda processar por danos',
            effect: { money: 18000, reputation: -2, narrative: 'Você recebeu com juros. Mas fez um inimigo no mercado.' }
          }
        ]
      }
    }
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'offer',
      clientId,
      title: 'Clube enrolando seu pagamento',
      description: `Um clube fechou negócio mas está enrolando para pagar sua comissão. Sem advogado, você está vulnerável. Um escritório jurídico fixo evitaria isso.`,
      choices: [
        {
          label: 'Contratar advogado avulso (R$6.000)',
          effect: { money: -6000, narrative: 'Recuperou a comissão, mas gastou pra isso. Um advogado fixo sairia mais barato no longo prazo.' }
        },
        {
          label: 'Aceitar receber só metade',
          effect: { money: -3000, reputation: -4, narrative: 'Você levou prejuízo. Calote engolido.' }
        }
      ]
    }
  }

  if (roll < 0.7) {
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'rival',
      clientId,
      title: 'Empresário rival assediando',
      description: `Um empresário concorrente está oferecendo condições melhores ao seu cliente. Ele está considerando trocar de representante.`,
      choices: [
        {
          label: 'Reduzir sua comissão para segurá-lo',
          effect: { happiness: 20, narrative: 'O jogador ficou satisfeito e rejeitou o rival.' }
        },
        {
          label: 'Confiar na relação que vocês têm',
          effect: { happiness: -5, narrative: 'Arriscado. O jogador ficou em dúvida mas ficou por enquanto.' }
        }
      ]
    }
  }

  if (roll < 0.82) {
    return {
      id: `ev-${year}-${week}`,
      week, year,
      type: 'breakout',
      clientId,
      title: 'Atuação espetacular!',
      description: `Seu cliente fez uma partida histórica. A imprensa está rasgando elogios. Proposta de clube grande pode vir em breve.`,
      choices: [
        {
          label: 'Alimentar a mídia — dar entrevistas',
          effect: { reputation: 10, clientValue: 20, narrative: 'Exposição aumentou o interesse dos clubes.' }
        },
        {
          label: 'Ficar quieto e esperar as propostas',
          effect: { clientValue: 10, narrative: 'Discrição. As propostas vão chegar de qualquer forma.' }
        }
      ]
    }
  }

  return {
    id: `ev-${year}-${week}`,
    week, year,
    type: 'personal',
    clientId,
    title: 'Família do jogador quer interferir',
    description: `O pai do seu cliente quer 5% de todas as negociações futuras. Está pressionando o filho contra você.`,
    choices: [
      {
        label: 'Aceitar — ceder 5% do seu quinhão',
        effect: { happiness: 15, narrative: 'Paz familiar mantida. Sua comissão caiu um pouco.' }
      },
      {
        label: 'Recusar firmemente',
        effect: { happiness: -20, reputation: 5, narrative: 'O jogador ficou numa situação difícil com a família.' }
      }
    ]
  }
}

// ─── SCOUTS (desbloqueiam lendas por país) ──────────────────────
export const SCOUT_UPGRADES = [
  {
    id: 'scout-FR', region: 'FR', name: 'Olheiro na França', flag: '🇫🇷',
    description: 'Uma rede de contatos no futebol francês para garimpar talentos antes de qualquer um.',
    cost: 6000, effect: 'Revela lendas francesas: Zidane, Henry, Drogba',
  },
  {
    id: 'scout-IT', region: 'IT', name: 'Olheiro na Itália', flag: '🇮🇹',
    description: 'Olhos dentro das categorias de base do calcio italiano.',
    cost: 7000, effect: 'Revela lendas italianas: Totti e cia',
  },
  {
    id: 'scout-IB', region: 'IB', name: 'Olheiro na Ibéria', flag: '🇵🇹',
    description: 'Cobertura de Portugal e Espanha — das ilhas a La Masia.',
    cost: 9000, effect: 'Revela lendas ibéricas: CR7 e Iniesta',
  },
  {
    id: 'scout-AR', region: 'AR', name: 'Olheiro na Argentina', flag: '🇦🇷',
    description: 'Contatos nas divisões de base argentinas. Onde nasce a magia.',
    cost: 8000, effect: 'Revela lendas argentinas: La Pulga e a nova geração',
  },
  {
    id: 'scout-NO', region: 'NO', name: 'Olheiro na Europa do Norte', flag: '🇳🇱',
    description: 'Rede pela Holanda, Suécia e Alemanha.',
    cost: 7000, effect: 'Revela lendas do norte europeu: Ibrahimović e cia',
  },
]

// ─── SERVIÇOS (ligados aos eventos) ─────────────────────────────
export const SERVICE_UPGRADES = [
  {
    id: 'assessoria-imprensa', name: 'Assessoria de Imprensa fixa', flag: '🎙️',
    description: 'Gerencia crises e exposição dos seus clientes. Quando vazar foto ou escândalo, ela resolve de GRAÇA — sem você pagar avulso a cada vez.',
    cost: 18000, effect: 'Escândalos resolvidos sem custo',
  },
  {
    id: 'advogado', name: 'Advogado especializado fixo', flag: '⚖️',
    description: 'Contratos blindados. Clube nenhum dá calote na sua comissão — e quando tentam, você ainda lucra.',
    cost: 20000, effect: 'Elimina risco de calote (vira lucro)',
  },
  {
    id: 'escritorio-sp', name: 'Escritório em São Paulo', flag: '🏢',
    description: 'Presença física em SP dá peso nas negociações com clubes brasileiros e aumenta sua reputação.',
    cost: 25000, effect: '+ reputação e força nas negociações BR',
  },
]

export const UPGRADE_OPTIONS = [...SCOUT_UPGRADES, ...SERVICE_UPGRADES]
