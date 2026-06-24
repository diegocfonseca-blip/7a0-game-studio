import type { TraitSynergy, StolenTrait } from '../types/game'

export const SYNERGIES: TraitSynergy[] = [
  {
    id: 'fenomeno-encantado',
    name: 'Fenômeno Encantado',
    icon: '⚡✨',
    description: 'Velocidade do Fenômeno + drible de Ronaldinho. Ninguém para.',
    requiredTraitIds: ['r9-speed', 'rdinho-dribble'],
    matchBonus: 0.18,
  },
  {
    id: 'canhao-foguete',
    name: 'Canhão Foguete',
    icon: '💥🚀',
    description: 'Poder do Imperador com a velocidade de Roberto Carlos.',
    requiredTraitIds: ['adriano-power', 'rc-speed'],
    matchBonus: 0.15,
  },
  {
    id: 'dupla-maestria',
    name: 'Dupla Maestria',
    icon: '🎯🎯',
    description: 'Dois cérebros sobrehumanos. O campo é um tabuleiro de xadrez.',
    requiredTraitIds: ['kaka-vision', 'totti-vision'],
    matchBonus: 0.14,
  },
  {
    id: 'gol-garantido',
    name: 'Gol Garantido',
    icon: '⚽⚽',
    description: 'Finalização do Fenômeno + precisão de Messi. Indefensável.',
    requiredTraitIds: ['r9-finish', 'messi-finish'],
    matchBonus: 0.20,
  },
  {
    id: 'cruzamento-mortal',
    name: 'Cruzamento Mortal',
    icon: '🎯🏟️',
    description: 'Roberto Carlos e Beckham no mesmo pé. Goleiros rezam.',
    requiredTraitIds: ['rc-cross', 'beckham-cross'],
    matchBonus: 0.16,
  },
  {
    id: 'falta-perfeita',
    name: 'Falta Perfeita',
    icon: '🌀💫',
    description: 'As três maiores faltas da história em um corpo só. Absurdo.',
    requiredTraitIds: ['rc-freekick', 'beckham-freekick', 'cr7-freekick'],
    matchBonus: 0.25,
  },
  {
    id: 'o-completo',
    name: 'O Completo',
    icon: '👑',
    description: 'Finalização, drible e visão. A santíssima trindade do futebol.',
    requiredTraitIds: ['r9-finish', 'rdinho-dribble', 'kaka-vision'],
    matchBonus: 0.30,
  },
  {
    id: 'velocidade-total',
    name: 'Velocidade Total',
    icon: '💨💨',
    description: 'Roberto Carlos, Henry e Ronaldo. Três foguetes. Você é os três.',
    requiredTraitIds: ['rc-speed', 'henry-speed', 'r9-speed'],
    matchBonus: 0.22,
  },
  {
    id: 'mental-de-ferro',
    name: 'Mental de Ferro',
    icon: '🧠💪',
    description: 'Obsessão de CR7, foco de Kaká, frieza de Henry. Imparável.',
    requiredTraitIds: ['cr7-mentality', 'kaka-focus', 'henry-composure'],
    matchBonus: 0.20,
  },
  {
    id: 'alegria-poder',
    name: 'Alegria com Poder',
    icon: '😄💥',
    description: 'A alegria de Ronaldinho com o físico de Adriano. Arte e força.',
    requiredTraitIds: ['rdinho-joy', 'adriano-physique'],
    matchBonus: 0.12,
  },
  {
    id: 'sangue-ladrão',
    name: 'Sangue de Ladrão',
    icon: '🩸✨',
    description: 'Drible de Messi + toque de Totti. Intocável com a bola.',
    requiredTraitIds: ['messi-dribble', 'totti-touch'],
    matchBonus: 0.17,
  },
  {
    id: 'imperador-completo',
    name: 'Imperador Completo',
    icon: '👑💥',
    description: 'Poder + físico + frieza no pênalti. Adriano era assim. Você é mais.',
    requiredTraitIds: ['adriano-power', 'adriano-physique', 'adriano-penalty'],
    matchBonus: 0.28,
  },
]

export function getActiveSynergies(traits: StolenTrait[]): TraitSynergy[] {
  const traitIds = traits.filter(t => t.maintenanceBar >= 30).map(t => t.traitId)
  return SYNERGIES.filter(s =>
    s.requiredTraitIds.every(id => traitIds.includes(id))
  )
}

export function getTotalSynergyMatchBonus(traits: StolenTrait[]): number {
  return getActiveSynergies(traits).reduce((sum, s) => sum + s.matchBonus, 0)
}
