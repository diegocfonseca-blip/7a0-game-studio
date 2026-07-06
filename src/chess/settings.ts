import { useState, useCallback } from 'react'
import type { ViewMode } from './types'

// ── User settings persisted in localStorage ──────────────────────────────
export interface UserSettings {
  name: string
  avatar: string          // emoji
  themeId: string
  view: ViewMode
  sound: boolean
  showHints: boolean
  animations: boolean
}

export const AVATARS = ['👤', '🦁', '🦅', '🐺', '🦈', '🐉', '👑', '⚔️', '🛡️', '🎩', '🧠', '🔥']

const KEY = 'chess-legends-settings'

const DEFAULTS: UserSettings = {
  name: '',
  avatar: '👤',
  themeId: 'wood',
  view: '2d',
  sound: true,
  showHints: false,
  animations: true,
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(s: UserSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings)

  const update = useCallback((patch: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, update }
}
