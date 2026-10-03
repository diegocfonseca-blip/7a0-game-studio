import type {CSSProperties,ReactNode} from 'react'
import {motion} from 'framer-motion'
const INK='#0C0C0C',GOLD='#FFC400'
const OSWALD={fontFamily:'Oswald, sans-serif'}
// Extraídos de screens.tsx sem alterar o visual das telas existentes.
export function Box({ children, bg = '#fff', className = '', shadow = 4, style }: { children: ReactNode; bg?: string; className?: string; shadow?: number; style?: CSSProperties }) {
  return (
    <div className={`border-[3px] border-black rounded-2xl ${className}`} style={{ background: bg, boxShadow: `${shadow}px ${shadow}px 0 0 ${INK}`, ...style }}>
      {children}
    </div>
  )
}
export function Btn({ children, onClick, bg = GOLD, disabled = false, className = '' }: { children: ReactNode; onClick: () => void; bg?: string; disabled?: boolean; className?: string }) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { x: 2, y: 2 }}
      onClick={onClick}
      disabled={disabled}
      className={`border-[3px] border-black rounded-xl px-4 py-3 font-black uppercase text-sm tracking-wide ${disabled ? 'opacity-40' : ''} ${className}`}
      style={{ backgroundColor: bg, boxShadow: disabled ? 'none' : `4px 4px 0 0 ${INK}`, ...OSWALD }}
    >
      {children}
    </motion.button>
  )
}
