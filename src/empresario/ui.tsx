import { motion } from 'framer-motion'
import type { ReactNode, CSSProperties } from 'react'

// ─── NEO-BRUTALIST DESIGN TOKENS ──────────────────────────────
export const C = {
  cream: '#F4ECD6',
  creamDark: '#EAE0C4',
  black: '#0C0C0C',
  blue: '#2B43E8',
  blueDark: '#1B2FB0',
  yellow: '#FFC400',
  teal: '#16B89A',
  tealDark: '#0E8C75',
  orange: '#FF5126',
  pink: '#FF5C8A',
  green: '#16B85A',
  purple: '#7C3AED',
}

export function money(v: number): string {
  if (v >= 1000000) return `R$${(v / 1000000).toFixed(v >= 10000000 ? 0 : 1)}M`
  if (v >= 1000) return `R$${Math.round(v / 1000)}k`
  return `R$${Math.round(v)}`
}

export function moneyFull(v: number): string {
  return `R$ ${Math.round(v).toLocaleString('pt-BR')}`
}

// ─── COMPONENTS ───────────────────────────────────────────────

export function BrutalCard({
  children, color = 'white', className = '', onClick, style, shadow = 5,
}: {
  children: ReactNode
  color?: string
  className?: string
  onClick?: () => void
  style?: CSSProperties
  shadow?: number
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: color === 'white' ? '#FFFFFF' : color,
        boxShadow: `${shadow}px ${shadow}px 0 0 ${C.black}`,
        ...style,
      }}
      className={`border-[3px] border-black rounded-2xl ${onClick ? 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function BrutalButton({
  children, color = C.blue, textColor = '#fff', onClick, disabled, className = '', full = true,
}: {
  children: ReactNode
  color?: string
  textColor?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
  full?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { x: 3, y: 3 }}
      style={{
        backgroundColor: disabled ? '#C9C2AC' : color,
        color: disabled ? '#7A745F' : textColor,
        boxShadow: disabled ? 'none' : `4px 4px 0 0 ${C.black}`,
      }}
      className={`border-[3px] border-black rounded-xl font-black uppercase tracking-wide
                  px-5 py-3.5 text-sm transition-all ${full ? 'w-full' : ''}
                  ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </motion.button>
  )
}

export function BrutalPill({
  children, color = C.yellow, textColor = C.black, className = '',
}: {
  children: ReactNode
  color?: string
  textColor?: string
  className?: string
}) {
  return (
    <span
      style={{ backgroundColor: color, color: textColor }}
      className={`inline-flex items-center gap-1 border-2 border-black rounded-full
                  px-2.5 py-1 text-xs font-black uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  )
}

export function BrutalTag({
  children, color = C.teal, textColor = C.black,
}: { children: ReactNode; color?: string; textColor?: string }) {
  return (
    <span
      style={{ backgroundColor: color, color: textColor }}
      className="inline-block border-2 border-black rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase font-mono tracking-tight"
    >
      {children}
    </span>
  )
}

export const POS_COLOR: Record<string, string> = {
  ATA: C.orange,
  MEI: C.blue,
  ZAG: C.green,
  LAT: C.purple,
  GOL: C.yellow,
}

export const FLAG: Record<string, string> = {
  BR: '🇧🇷', AR: '🇦🇷', FR: '🇫🇷', IT: '🇮🇹',
  PT: '🇵🇹', ES: '🇪🇸', NL: '🇳🇱', DE: '🇩🇪',
}

export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pelada:  { label: 'JOGA PELADA',   color: C.pink },
  base:    { label: 'CATEGORIA BASE', color: C.yellow },
  pro:     { label: 'PROFISSIONAL',  color: C.teal },
  estrela: { label: 'ESTRELA',       color: C.orange },
}
