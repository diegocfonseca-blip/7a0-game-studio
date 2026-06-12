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
  bg: '#080808',
  bgGrad: 'linear-gradient(160deg, #080808 0%, #0f0f0f 55%, #120c00 100%)',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.18)',
  text: 'rgba(255,255,255,0.88)',
  textDim: 'rgba(255,255,255,0.35)',
  textMuted: 'rgba(255,255,255,0.15)',
  topbar: 'rgba(0,0,0,0.65)',
  topbarBorder: 'rgba(255,255,255,0.07)',
  gold: '#C9A84C',
  goldDim: 'rgba(201,168,76,0.14)',
  goldGlow: 'rgba(201,168,76,0.5)',
  red: '#D12E2E',
  redDim: 'rgba(209,46,46,0.18)',
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
