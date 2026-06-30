import type { GameEvent } from '../types'

// Legend-specific backstory events. Fire once per game when the client is
// in your roster in the trigger year. Choices let YOU shape history.
export interface LegendBackstoryEvent {
  id: string
  legendId: string
  triggerYear: number
  title: string
  description: string
  type: GameEvent['type']
  choices: [
    { label: string; effect: { money?: number; happiness?: number; reputation?: number; clientValue?: number; narrative: string } },
    { label: string; effect: { money?: number; happiness?: number; reputation?: number; clientValue?: number; narrative: string } }
  ]
}

export const LEGEND_BACKSTORY_EVENTS: LegendBackstoryEvent[] = [
  // ── RONALDO FENÔMENO ──────────────────────────────────────────────────
  {
    id: 'r9_1997_inter',
    legendId: 'r9',
    triggerYear: 1997,
    type: 'personal',
    title: '💰 Ronaldo quer sair do Barcelona!',
    description: 'O Fenômeno está inquieto no Barça. O Inter de Milão liga com proposta histórica de €19M. Você pode fechar o negócio do século — ou convencer o Baixinho a ficar e virar ídolo eterno na Catalunha.',
    choices: [
      {
        label: '✅ Fechar com o Inter',
        effect: { money: 120000, happiness: 15, reputation: 8, clientValue: 40,
          narrative: '🇮🇹 NEGÓCIO HISTÓRICO! Você transferiu Ronaldo pro Inter por €19M — a maior transferência da história. O mundo parou pra falar do seu nome.' },
      },
      {
        label: '🔴 Segurar no Barça',
        effect: { happiness: -5, reputation: 3, clientValue: 15,
          narrative: '💙❤️ Ronaldo ficou no Barça mais um ano — e continuou marcando gols de outro mundo. O Inter ficou no vácuo.' },
      },
    ],
  },
  {
    id: 'r9_2000_joelho',
    legendId: 'r9',
    triggerYear: 2000,
    type: 'injury',
    title: '🦵 Ronaldo: ruptura do ligamento. Cirurgia urgente.',
    description: 'O impensável aconteceu: Ronaldo rompeu o ligamento cruzado novamente. A Itália segura o fôlego. O Inter tenta reduzir o salário durante a recuperação. Você precisa proteger seu cliente.',
    choices: [
      {
        label: '⚖️ Processar o Inter',
        effect: { money: 50000, happiness: 5, reputation: -5, clientValue: -20,
          narrative: '⚖️ Você foi pra Justiça e garantiu o salário integral de Ronaldo durante a recuperação. O Inter ficou furioso — mas seu cliente não perdeu um centavo.' },
      },
      {
        label: '🤝 Negociar com o clube',
        effect: { money: -20000, happiness: 10, reputation: 5, clientValue: -15,
          narrative: '🤝 Você cedeu parcialmente nos salários, mas o Inter se comprometeu a cuidar da reabilitação com o melhor staff médico do mundo. Ronaldo voltará mais forte.' },
      },
    ],
  },
  {
    id: 'r9_2002_volta',
    legendId: 'r9',
    triggerYear: 2002,
    type: 'breakout',
    title: '⭐ RONALDO ESTÁ DE VOLTA — Copa do Mundo!',
    description: 'Dois anos de sofrimento e agora o Fenômeno está convocado para a Copa de 2002. Imprensa italiana duvida. Você pode apostar alto na recuperação completa e falar pro mundo — ou ficar quieto.',
    choices: [
      {
        label: '📢 Declarar pro mundo',
        effect: { money: 30000, happiness: 20, reputation: 12, clientValue: 50,
          narrative: '📢 Você disse ao mundo: "Ronaldo vai ser o melhor da Copa." Dois gols na final depois, você estava certo. Sua reputação disparou.' },
      },
      {
        label: '🤫 Deixar os gols falarem',
        effect: { happiness: 15, reputation: 5, clientValue: 40,
          narrative: '🎯 Sem barulho, sem promessa — só os dois gols de Ronaldo na final contra a Alemanha. Ele não precisou de palavras.' },
      },
    ],
  },

  // ── ZIDANE ────────────────────────────────────────────────────────────
  {
    id: 'zizou_2001_real',
    legendId: 'zizou',
    triggerYear: 2001,
    type: 'offer',
    title: '✨ Real Madrid quer Zidane por €75M!',
    description: 'Florentino Pérez liga pessoalmente. O Real quer Zidane a qualquer preço — €75M na mesa. É a transferência mais cara da história. Mas a Juventus está oferecendo renovação dourada.',
    choices: [
      {
        label: '⚪ Aceitar o Real',
        effect: { money: 180000, happiness: 12, reputation: 15, clientValue: 45,
          narrative: '⚡ €75M. Novo recorde mundial. Zidane é galáctico. Você fez o negócio mais lucrativo do futebol. O mundo nunca esquecerá esse dia.' },
      },
      {
        label: '⚫ Renovar na Juve',
        effect: { money: 40000, happiness: 8, reputation: 3, clientValue: 10,
          narrative: '🖤⚪ Zidane ficou na Juve e ganhou mais um Scudetto. Uma escolha sólida — mas o Real Madrid ofereceu €75M e você disse não.' },
      },
    ],
  },
  {
    id: 'zizou_2006_cabecada',
    legendId: 'zizou',
    triggerYear: 2006,
    type: 'scandal',
    title: '😤 A CABEÇADA. Materazzi provocou — Zizou perdeu.',
    description: 'Final da Copa. 110 minutos. Materazzi diz algo impensável. Zidane vira e cabeceia o italiano no peito. Cartão vermelho. O jogo mais importante da história termina assim. Você precisa gerenciar a saída do maior jogador de todos os tempos.',
    choices: [
      {
        label: '📸 Proteger a imagem',
        effect: { money: 20000, happiness: -10, reputation: 5,
          narrative: '📸 Você trabalhou pra humanizar Zidane na mídia. A cabeçada virou símbolo de dignidade. Seu legado saiu intacto — talvez até maior.' },
      },
      {
        label: '🎙️ Deixar ele se explicar',
        effect: { happiness: -5, reputation: 3, clientValue: -10,
          narrative: '🎙️ Zidane deu entrevista ao mundo e explicou o que Materazzi disse. O mundo foi com ele. Alguns falam que a cabeçada foi o gol mais famoso da história.' },
      },
    ],
  },

  // ── RONALDINHO ────────────────────────────────────────────────────────
  {
    id: 'dinho_2005_barcelona',
    legendId: 'ronaldinho',
    triggerYear: 2005,
    type: 'breakout',
    title: '🪄 RONALDINHO FEZ TODOS APLAUDIREM NO BERNABÉU',
    description: 'Outubro de 2005. Ronaldinho humilhou o Real Madrid no Bernabéu e recebeu uma ovação dos torcedores adversários. Isso nunca tinha acontecido. A mídia quer entrevista exclusiva com você.',
    choices: [
      {
        label: '💰 Vender a exclusiva',
        effect: { money: 60000, reputation: 5, happiness: 10, clientValue: 30,
          narrative: '📺 A entrevista foi ao mundo inteiro. Você embolsou R$60.000 em direitos de imagem e Ronaldinho virou a maior estrela do planeta.' },
      },
      {
        label: '🎭 Deixar o jogo falar',
        effect: { happiness: 15, clientValue: 35, reputation: 8,
          narrative: '🪄 Você manteve o mistério. Ronaldinho deixou o Bernabéu em silêncio e o futebol virou magia. O valor dele explodiu sem precisar de entrevista nenhuma.' },
      },
    ],
  },

  // ── RIVALDO ───────────────────────────────────────────────────────────
  {
    id: 'rivaldo_1999_bola_ouro',
    legendId: 'rivaldo',
    triggerYear: 1999,
    type: 'breakout',
    title: '⭐ RIVALDO É O MELHOR DO MUNDO!',
    description: 'Rivaldo vence o Bola de Ouro de 1999. Uma temporada épica no Barcelona. Três clubes ligam pra você com propostas milionárias — Bayern, Inter e Manchester United. O Barça quer renovar.',
    choices: [
      {
        label: '🔴 Renovar no Barça',
        effect: { money: 50000, happiness: 20, reputation: 5, clientValue: 25,
          narrative: '💙❤️ Rivaldo ficou no Barça. A torcida o ama. E você fechou um salário de puta que pariu na renovação.' },
      },
      {
        label: '💸 Negociar com clube europeu',
        effect: { money: 100000, happiness: 10, reputation: 10, clientValue: 20,
          narrative: '✈️ Você usou o Bola de Ouro como alavanca e forçou o Barça a pagar mais — ou transferir por muito dinheiro. Rivaldo ficou feliz; você também.' },
      },
    ],
  },

  // ── GEORGE WEAH ───────────────────────────────────────────────────────
  {
    id: 'weah_1995_bola_ouro',
    legendId: 'weah',
    triggerYear: 1995,
    type: 'breakout',
    title: '🌍 GEORGE WEAH: PRIMEIRO AFRICANO NA HISTÓRIA!',
    description: 'George Weah vence o Bola de Ouro de 1995 — o primeiro africano jamais a ganhar esse prêmio. O mundo inteiro olha. Libéria para. Você tem na carteira o maior jogador africano de todos os tempos.',
    choices: [
      {
        label: '🌍 Gravar campanha continental',
        effect: { money: 40000, happiness: 25, reputation: 10, clientValue: 30,
          narrative: '🌍 Você negociou uma campanha publicitária de impacto continental. Weah virou símbolo do futebol africano — e você virou o agente mais falado do continente.' },
      },
      {
        label: '⚽ Focar no campo',
        effect: { happiness: 20, reputation: 6, clientValue: 40,
          narrative: '⚽ Sem holofotes, sem distrações. Weah continuou dominando na Europa. O futebol falou por ele.' },
      },
    ],
  },

  // ── FIGO ─────────────────────────────────────────────────────────────
  {
    id: 'figo_2000_real',
    legendId: 'figo',
    triggerYear: 2000,
    type: 'offer',
    title: '💸 Real Madrid quer Figo por €60M — recorde!',
    description: 'Florentino Pérez tem um plano maluco: tirar Figo do Barcelona e levá-lo pro Real Madrid. €60M na mesa. A torcida do Barça vai enlouquecer. Você sabe disso — e pode lucrar muito.',
    choices: [
      {
        label: '✅ Fechar o negócio',
        effect: { money: 150000, happiness: 5, reputation: 12, clientValue: 30,
          narrative: '⚡ €60M. Novo recorde. Figo foi pro Real e a torcida do Barça jogou uma cabeça de porco nele no Bernabéu. Mas você embolsou a comissão mais gorda da história.' },
      },
      {
        label: '❌ Recusar — lealdade ao Barça',
        effect: { happiness: 15, reputation: 8, clientValue: 15,
          narrative: '💙❤️ Figo ficou. A torcida do Barça o amou ainda mais. Uma decisão honrosa — mas você deixou €150.000 de comissão na mesa.' },
      },
    ],
  },

  // ── HENRY ────────────────────────────────────────────────────────────
  {
    id: 'henry_2004_arsenal',
    legendId: 'henry',
    triggerYear: 2004,
    type: 'breakout',
    title: '🔴 Arsenal INVICTO — Henry é o melhor do mundo',
    description: 'O Arsenal terminou a Premier League 2003-04 invicto. Henry marcou 30 gols. O Real Madrid e o Barcelona estão em guerra por ele. Você pode fazer a maior transferência do futebol inglês.',
    choices: [
      {
        label: '✈️ Deixar o Arsenal',
        effect: { money: 130000, happiness: 8, reputation: 10, clientValue: 35,
          narrative: '💸 Henry foi pro Barcelona por €24M. Uma temporada depois, era o trio com Messi e Eto\'o. Você acertou em cheio.' },
      },
      {
        label: '🔴 Ficar no Arsenal',
        effect: { money: 30000, happiness: 15, reputation: 6, clientValue: 20,
          narrative: '🔴 Henry ficou no Arsenal e continuou destruindo. Wenger renovou com salário de estrela e você garantiu sua comissão sem fazer barulho.' },
      },
    ],
  },

  // ── KAKÁ ─────────────────────────────────────────────────────────────
  {
    id: 'kaka_2009_real',
    legendId: 'kaka',
    triggerYear: 2009,
    type: 'offer',
    title: '✝️ Real Madrid quer Kaká por €65M!',
    description: 'Florentino Pérez volta à carga. Desta vez é Kaká — o melhor jogador do mundo em 2007. €65M do Real Madrid. O Milan quer segurar. Kaká quer decidir com base na fé e na família.',
    choices: [
      {
        label: '⚽ Ir pro Real Madrid',
        effect: { money: 160000, happiness: 10, reputation: 12, clientValue: 30,
          narrative: '⚪ Kaká foi pro Real por €65M. As lesões vieram depois — mas a comissão você já tinha embolsado. Um negócio de outro mundo.' },
      },
      {
        label: '🔴 Ficar no Milan',
        effect: { money: 25000, happiness: 20, reputation: 5, clientValue: 15,
          narrative: '❤️⚫ "Pertença a Deus." Kaká ficou no Milan. A torcida virou ídolo. Você perdeu o maior negócio do ano mas ganhou um cliente fiel pra vida.' },
      },
    ],
  },

  // ── MESSI ────────────────────────────────────────────────────────────
  {
    id: 'messi_2012_bola_ouro_4',
    legendId: 'messi',
    triggerYear: 2012,
    type: 'breakout',
    title: '👑 MESSI: 4º BOLA DE OURO CONSECUTIVO',
    description: 'Lionel Messi vence o Bola de Ouro pela quarta vez seguida. 91 gols em 2012 — o recorde mais louco da história. Marcas patrocinadoras disputam seu cliente. Nike, Adidas, EA Sports...',
    choices: [
      {
        label: '💰 Fechar com Adidas',
        effect: { money: 200000, happiness: 15, reputation: 8, clientValue: 40,
          narrative: '⚽ O maior contrato de patrocínio do futebol: Messi com a Adidas. Você intermediou e ganhou uma participação histórica.' },
      },
      {
        label: '🎯 Esperar proposta melhor',
        effect: { money: 80000, reputation: 5, clientValue: 30,
          narrative: '🎯 Você negociou com calma e fechou um portfólio de marcas. Menos barulho, mais grana — o jeito inteligente de fazer negócio.' },
      },
    ],
  },
  {
    id: 'messi_2021_copa_choro',
    legendId: 'messi',
    triggerYear: 2021,
    type: 'breakout',
    title: '💙🤍 MESSI CHORA — Argentina vence a Copa América!',
    description: 'No Maracanã, Argentina bate o Brasil e Messi levanta seu primeiro título com a Seleção. Ele chora. O mundo chora junto. Você sabia que esse momento ia chegar — e estava lá.',
    choices: [
      {
        label: '🎥 Documentário exclusivo',
        effect: { money: 100000, happiness: 25, reputation: 10, clientValue: 35,
          narrative: '🎬 Você fechou um documentário sobre a jornada de Messi rumo ao título. Streaming, cinema, o mundo inteiro viu. Você embolsou 7 dígitos.' },
      },
      {
        label: '🏆 Deixar o momento ser eterno',
        effect: { happiness: 25, reputation: 8, clientValue: 45,
          narrative: '✨ Sem câmera, sem holofotes. Só o choro de Messi e a taça nas mãos. Um momento que não precisa de produção — e que nunca vai ser esquecido.' },
      },
    ],
  },

  // ── NEYMAR ───────────────────────────────────────────────────────────
  {
    id: 'neymar_2017_psg',
    legendId: 'neymar',
    triggerYear: 2017,
    type: 'offer',
    title: '💸 PSG quer Neymar por €222M — NUNCA ANTES NA HISTÓRIA',
    description: '€222 MILHÕES. Duzentos e vinte e dois. O PSG vai acionar a cláusula de liberação de Neymar no Barcelona. O negócio mais caro da história do esporte. Você pode fechar — ou segurar.',
    choices: [
      {
        label: '✅ Ativar a cláusula',
        effect: { money: 400000, happiness: 12, reputation: 20, clientValue: 40,
          narrative: '🗼 €222M. Você fechou o negócio mais caro da história do esporte. Paris virou seu escritório. Neymar virou Paris. E você virou lenda.' },
      },
      {
        label: '💙❤️ Segurar no Barça',
        effect: { money: 50000, happiness: 8, reputation: 5, clientValue: 20,
          narrative: '💙❤️ Você disse não ao PSG. Neymar ficou no Barça ao lado de Messi. O trio continuou destruindo. Mas o mundo ficou curioso — e se tivesse ido?' },
      },
    ],
  },

  // ── CRISTIANO RONALDO ────────────────────────────────────────────────
  {
    id: 'cr7_2018_juve',
    legendId: 'cr7',
    triggerYear: 2018,
    type: 'offer',
    title: '⚫⚪ Juventus quer CR7 por €100M!',
    description: 'A Juve entra em campo: €100M pelo melhor da última década. Cristiano quer sair do Real depois de 9 anos e 4 Champions. Madrid não quer vender. Você precisa forçar a saída — ou convencer a ficar.',
    choices: [
      {
        label: '⚫⚪ Fechar com a Juve',
        effect: { money: 220000, happiness: 10, reputation: 12, clientValue: 25,
          narrative: '⚫⚪ CR7 chegou à Juve e o mundo parou. Itália nunca foi tão pequena. Você fechou o negócio do ano — e embolsou sua fatia histórica.' },
      },
      {
        label: '⚪ Exigir mais dinheiro',
        effect: { money: 280000, happiness: 5, reputation: 15, clientValue: 20,
          narrative: '💰 Você usou o interesse da Juve como pressão e forçou um aumento absurdo no Real. Depois de 2 meses, a transferência foi com €15M a mais. Trabalho de mestre.' },
      },
    ],
  },
]

// Returns legend events that should fire this week (not already in state events)
export function getLegendEvents(
  year: number,
  week: number,
  clientLegendIds: string[],
  existingEventIds: string[],
): LegendBackstoryEvent[] {
  return LEGEND_BACKSTORY_EVENTS.filter(e =>
    e.triggerYear === year &&
    week >= 10 && week <= 20 && // fire mid-year only
    clientLegendIds.includes(e.legendId) &&
    !existingEventIds.includes(e.id)
  )
}
