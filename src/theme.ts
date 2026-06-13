export type ThemeMode = 'dark' | 'light'

export interface ThemePalette {
  bg: string
  bgGrad: string
  surface: string
  surface2: string
  border: string
  border2: string
  text: string
  textDim: string
  textMuted: string
  topbar: string
  topbarBorder: string
  gold: string
  goldDim: string
  goldGlow: string
  red: string
  redDim: string
  mode: ThemeMode
}

export const DARK: ThemePalette = {
  bg: '#08080d',
  bgGrad: 'linear-gradient(160deg, #0c0c12 0%, #111118 55%, #130e02 100%)',
  surface: 'rgba(255,255,255,0.07)',
  surface2: 'rgba(255,255,255,0.13)',
  border: 'rgba(255,255,255,0.1)',
  border2: 'rgba(255,255,255,0.22)',
  text: '#ffffff',
  textDim: 'rgba(255,255,255,0.45)',
  textMuted: 'rgba(255,255,255,0.22)',
  topbar: 'rgba(8,8,13,0.92)',
  topbarBorder: 'rgba(255,255,255,0.08)',
  gold: '#D4A840',
  goldDim: 'rgba(212,168,64,0.16)',
  goldGlow: 'rgba(212,168,64,0.55)',
  red: '#E03535',
  redDim: 'rgba(224,53,53,0.2)',
  mode: 'dark',
}

export const LIGHT: ThemePalette = {
  bg: '#f5edd8',
  bgGrad: 'linear-gradient(160deg, #f7efd8 0%, #ede5cc 55%, #f3e8c8 100%)',
  surface: 'rgba(0,0,0,0.04)',
  surface2: 'rgba(0,0,0,0.07)',
  border: 'rgba(0,0,0,0.09)',
  border2: 'rgba(0,0,0,0.18)',
  text: '#1a1000',
  textDim: 'rgba(0,0,0,0.5)',
  textMuted: 'rgba(0,0,0,0.22)',
  topbar: 'rgba(255,255,255,0.88)',
  topbarBorder: 'rgba(0,0,0,0.07)',
  gold: '#7a5008',
  goldDim: 'rgba(122,80,8,0.1)',
  goldGlow: 'rgba(122,80,8,0.3)',
  red: '#b01818',
  redDim: 'rgba(176,24,24,0.12)',
  mode: 'light',
}

export function getTheme(mode: ThemeMode): ThemePalette {
  return mode === 'light' ? LIGHT : DARK
}
