import type { Position } from './squads'

export interface FormationSlot {
  position: Position
  x: number // % horizontal no campo
  y: number // % vertical no campo (0=ataque, 100=defesa)
  label: string
}

export interface Formation {
  name: string
  slots: FormationSlot[]
}

export const FORMATIONS: Record<string, Formation> = {
  '4-3-3': {
    name: '4-3-3',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'LD',  x: 80, y: 74, label: 'LD' },
      { position: 'ZAG', x: 60, y: 74, label: 'ZAG' },
      { position: 'ZAG', x: 40, y: 74, label: 'ZAG' },
      { position: 'LE',  x: 20, y: 74, label: 'LE' },
      { position: 'MC',  x: 65, y: 54, label: 'MC' },
      { position: 'VOL', x: 50, y: 54, label: 'VOL' },
      { position: 'MC',  x: 35, y: 54, label: 'MC' },
      { position: 'PD',  x: 78, y: 28, label: 'PD' },
      { position: 'CA',  x: 50, y: 18, label: 'CA' },
      { position: 'PE',  x: 22, y: 28, label: 'PE' },
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'LD',  x: 80, y: 74, label: 'LD' },
      { position: 'ZAG', x: 60, y: 74, label: 'ZAG' },
      { position: 'ZAG', x: 40, y: 74, label: 'ZAG' },
      { position: 'LE',  x: 20, y: 74, label: 'LE' },
      { position: 'MD',  x: 78, y: 50, label: 'MD' },
      { position: 'MC',  x: 58, y: 50, label: 'MC' },
      { position: 'MC',  x: 38, y: 50, label: 'MC' },
      { position: 'ME',  x: 18, y: 50, label: 'ME' },
      { position: 'CA',  x: 62, y: 22, label: 'CA' },
      { position: 'CA',  x: 38, y: 22, label: 'CA' },
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'LD',  x: 80, y: 74, label: 'LD' },
      { position: 'ZAG', x: 60, y: 74, label: 'ZAG' },
      { position: 'ZAG', x: 40, y: 74, label: 'ZAG' },
      { position: 'LE',  x: 20, y: 74, label: 'LE' },
      { position: 'VOL', x: 62, y: 58, label: 'VOL' },
      { position: 'VOL', x: 38, y: 58, label: 'VOL' },
      { position: 'PD',  x: 75, y: 36, label: 'PD' },
      { position: 'MEI', x: 50, y: 36, label: 'MEI' },
      { position: 'PE',  x: 25, y: 36, label: 'PE' },
      { position: 'CA',  x: 50, y: 16, label: 'CA' },
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'ZAG', x: 68, y: 76, label: 'ZAG' },
      { position: 'ZAG', x: 50, y: 76, label: 'ZAG' },
      { position: 'ZAG', x: 32, y: 76, label: 'ZAG' },
      { position: 'MD',  x: 82, y: 52, label: 'MD' },
      { position: 'MC',  x: 65, y: 52, label: 'MC' },
      { position: 'VOL', x: 50, y: 52, label: 'VOL' },
      { position: 'MC',  x: 35, y: 52, label: 'MC' },
      { position: 'ME',  x: 18, y: 52, label: 'ME' },
      { position: 'CA',  x: 62, y: 22, label: 'CA' },
      { position: 'CA',  x: 38, y: 22, label: 'CA' },
    ]
  },
  '4-1-4-1': {
    name: '4-1-4-1',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'LD',  x: 80, y: 74, label: 'LD' },
      { position: 'ZAG', x: 60, y: 74, label: 'ZAG' },
      { position: 'ZAG', x: 40, y: 74, label: 'ZAG' },
      { position: 'LE',  x: 20, y: 74, label: 'LE' },
      { position: 'VOL', x: 50, y: 60, label: 'VOL' },
      { position: 'MD',  x: 78, y: 44, label: 'MD' },
      { position: 'MC',  x: 58, y: 44, label: 'MC' },
      { position: 'MC',  x: 38, y: 44, label: 'MC' },
      { position: 'ME',  x: 18, y: 44, label: 'ME' },
      { position: 'CA',  x: 50, y: 16, label: 'CA' },
    ]
  },
  '3-4-3': {
    name: '3-4-3',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'ZAG', x: 68, y: 76, label: 'ZAG' },
      { position: 'ZAG', x: 50, y: 76, label: 'ZAG' },
      { position: 'ZAG', x: 32, y: 76, label: 'ZAG' },
      { position: 'MD',  x: 75, y: 54, label: 'MD' },
      { position: 'MC',  x: 57, y: 54, label: 'MC' },
      { position: 'MC',  x: 39, y: 54, label: 'MC' },
      { position: 'ME',  x: 21, y: 54, label: 'ME' },
      { position: 'PD',  x: 75, y: 22, label: 'PD' },
      { position: 'CA',  x: 50, y: 16, label: 'CA' },
      { position: 'PE',  x: 25, y: 22, label: 'PE' },
    ]
  },
  '5-3-2': {
    name: '5-3-2',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'LD',  x: 84, y: 72, label: 'LD' },
      { position: 'ZAG', x: 67, y: 76, label: 'ZAG' },
      { position: 'ZAG', x: 50, y: 76, label: 'ZAG' },
      { position: 'ZAG', x: 33, y: 76, label: 'ZAG' },
      { position: 'LE',  x: 16, y: 72, label: 'LE' },
      { position: 'MC',  x: 65, y: 50, label: 'MC' },
      { position: 'VOL', x: 50, y: 50, label: 'VOL' },
      { position: 'MC',  x: 35, y: 50, label: 'MC' },
      { position: 'CA',  x: 62, y: 22, label: 'CA' },
      { position: 'CA',  x: 38, y: 22, label: 'CA' },
    ]
  },
  '4-5-1': {
    name: '4-5-1',
    slots: [
      { position: 'GOL', x: 50, y: 91, label: 'GOL' },
      { position: 'LD',  x: 80, y: 74, label: 'LD' },
      { position: 'ZAG', x: 60, y: 74, label: 'ZAG' },
      { position: 'ZAG', x: 40, y: 74, label: 'ZAG' },
      { position: 'LE',  x: 20, y: 74, label: 'LE' },
      { position: 'MD',  x: 82, y: 48, label: 'MD' },
      { position: 'MC',  x: 64, y: 48, label: 'MC' },
      { position: 'VOL', x: 46, y: 48, label: 'VOL' },
      { position: 'MC',  x: 28, y: 48, label: 'MC' },
      { position: 'ME',  x: 10, y: 48, label: 'ME' },
      { position: 'CA',  x: 50, y: 18, label: 'CA' },
    ]
  },
}

export const POSITION_COMPAT: Record<Position, Position[]> = {
  'GOL': ['GOL'],
  'LD':  ['LD', 'ZAG', 'MD'],
  'ZAG': ['ZAG', 'LD', 'LE'],
  'LE':  ['LE', 'ZAG', 'ME'],
  'VOL': ['VOL', 'MC', 'MD'],
  'MC':  ['MC', 'VOL', 'MEI', 'MD', 'ME'],
  'MD':  ['MD', 'MC', 'LD', 'PD'],
  'ME':  ['ME', 'MC', 'LE', 'PE'],
  'MEI': ['MEI', 'MC', 'CA', 'PD', 'PE'],
  'PD':  ['PD', 'MD', 'CA', 'MEI'],
  'PE':  ['PE', 'ME', 'CA', 'MEI'],
  'CA':  ['CA', 'MEI', 'PD', 'PE'],
}

export function canPlayPosition(playerPrimary: Position, playerSecondary: Position[], slotPosition: Position): boolean {
  if (playerPrimary === slotPosition) return true
  if (playerSecondary.includes(slotPosition)) return true
  const compat = POSITION_COMPAT[slotPosition] || []
  return compat.includes(playerPrimary)
}
