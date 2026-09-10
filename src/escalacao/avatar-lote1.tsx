import type { CSSProperties } from 'react'
import { legendAvatar } from './legend-avatars'
import './avatar-lote1.css'

export const LOTE_1 = [
  { name: 'Toni Kroos', club: 'Real Madrid', year: 2016, x: 0, y: 0 },
  { name: 'Francesco Totti', club: 'Roma', year: 2001, x: 100, y: 0 },
  { name: 'Rodri', club: 'Man City', year: 2024, x: 0, y: 100 },
  { name: 'David Beckham', club: 'Man United', year: 1999, x: 100, y: 100 },
] as const
export function avatarLote1(name: string, club?: string, year?: number) {
  return legendAvatar(name, club, year)
}
/** Pure presentation. Caller must enforce the existing local preview gate. */
export function AvatarLote1({ name, club, year, style }: { name: string; club?: string; year?: number; style?: CSSProperties }) {
  const art = avatarLote1(name, club, year)
  if (!art) return null
  return <img className="ll-lote1-avatar" src={`${import.meta.env.BASE_URL}${art.src.slice(1)}`} alt={`${name} · ${club} · ${year}`} loading="lazy" decoding="async" draggable={false} width={600} height={400} data-avatar-key={`${art.name}|${art.club}|${art.year}`} style={{ objectFit: 'contain', height: 'auto', ...style }} />
}
