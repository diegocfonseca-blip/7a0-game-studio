import type { ReactNode } from 'react'
import type { CompId } from './competicoes-visual'

const GOLD = '#D9B450', GOLD_DARK = '#A87E27', SILVER = '#CDD4D8', SILVER_DARK = '#98A5AE', INK = '#0C0C0C'
// Original illustrations for the approved social profile: one canvas, outline,
// palette and display size. Real competitions keep their recognizable silhouette;
// the game's own competitions have their own emblem. No photos or old PNG cups.
// Shape references (not copied artwork): Brasileirão's diamond/ball, Copa do
// Brasil's silver cup, Supercopa's tall handles, Libertadores' player/base,
// Champions' large handles, World Cup's globe and Club World Cup's gold disc.
const illustrations: Partial<Record<CompId, ReactNode>> = {
  carA: <>
    <path d="M24 22 50 10 76 22 66 56 50 84 34 56Z" fill={SILVER} />
    <path d="m26 25 24 8 24-8-24 37Z" fill="#F1F1DF" />
    <path d="m30 24 20 10 20-10-20 33Z" fill={GOLD_DARK} />
    <circle cx="50" cy="36" r="16" fill={GOLD} />
    <path d="m45 25 10 0 5 9-10 8-10-8Zm-7 24 12-7 12 7M50 57v25m-9-11-5 26h28l-5-26" fill="none" />
    <path d="M34 98h32v9H34Z" fill={SILVER} />
  </>,
  copabr: <>
    <path d="M29 27C6 14 9 68 35 70L34 60C18 62 15 28 30 36m41-9C94 14 91 68 65 70L66 60C82 62 85 28 70 36" fill={SILVER} />
    <path d="M28 22h44c0 29-7 48-22 56-15-8-22-27-22-56Z" fill={SILVER} />
    <ellipse cx="50" cy="22" rx="22" ry="5" fill="#F3F2E8" />
    <path d="M39 34c1 20 5 29 11 34m0 10v15m-13 9 4-9h18l4 9" fill="none" />
    <path d="M34 101h32v8H34Z" fill={SILVER_DARK} />
    <path d="M46 39h8v10h-8Z" fill={GOLD} />
  </>,
  supercopa: <>
    <path d="M35 36C25 2 4 14 19 50l17 19m29-33C75 2 96 14 81 50L64 69" fill="none" strokeWidth="7" />
    <path d="M35 36C25 2 4 14 19 50l17 19m29-33C75 2 96 14 81 50L64 69" fill="none" stroke={SILVER} strokeWidth="3.5" />
    <path d="M31 26h38l-6 53-13 13-13-13Z" fill={GOLD} />
    <ellipse cx="50" cy="26" rx="19" ry="4" fill="#F6E5B3" />
    <circle cx="50" cy="49" r="10" fill={SILVER} />
    <path d="m46 43 7-1 4 6-7 7-7-7Zm-4 49-4 13h24l-4-13" fill={SILVER_DARK} />
  </>,
  liberta: <>
    <path d="M28 95h44l6 17H22Z" fill={GOLD_DARK} />
    <path d="M35 89h30v7H35Z" fill={SILVER} />
    <path d="M43 89V76h14v13" fill={SILVER_DARK} />
    <path d="M30 43h40c-1 20-7 31-20 34-13-3-19-14-20-34Z" fill={SILVER} />
    <path d="M31 47C17 43 19 65 36 65m33-18C83 43 81 65 64 65" fill="none" />
    <circle cx="50" cy="12" r="5" fill={SILVER} />
    <path d="m50 18 1 15m-1-12-10 7m11-5 10-5m-10 15-9 9m9-9 10 7" fill="none" strokeWidth="4" />
    <circle cx="65" cy="41" r="3.5" fill={SILVER} />
    <path d="M30 100h40M34 106h32" stroke="#E9D59D" strokeWidth="2" />
  </>,
  champions: <>
    <path d="M30 25C2 8 1 71 38 73L35 63C15 63 12 24 29 34m41-9C98 8 99 71 62 73L65 63C85 63 88 24 71 34" fill={SILVER} />
    <path d="M28 21h44c1 38-8 60-22 65-14-5-23-27-22-65Z" fill={SILVER} />
    <ellipse cx="50" cy="21" rx="22" ry="5" fill="#F1F1E9" />
    <path d="M39 36c0 19 3 32 10 38" fill="none" stroke="#FFFFF4" strokeWidth="3" />
    <path d="M44 86v12h12V86m-20 15h28v8H36Z" fill={SILVER_DARK} />
  </>,
  mundo: <>
    <path d="M32 108c-5-25 5-42 13-51-11-14-5-30 5-30s16 16 5 30c8 9 18 26 13 51Z" fill={GOLD} />
    <circle cx="50" cy="25" r="16" fill={GOLD} />
    <path d="m39 15 8 2 3 8-8 7-7-8m24-10-7 6 5 8 8-1M37 91c-1-14 6-23 13-31 7 8 14 17 13 31M42 62 31 48m27 14 11-14" fill="none" />
    <path d="M33 103h34v8H33Z" fill="#50744A" />
  </>,
  mundial: <>
    <circle cx="50" cy="44" r="34" fill={GOLD} />
    <circle cx="50" cy="44" r="26" fill="#F0D88C" />
    <circle cx="50" cy="44" r="18" fill={GOLD} />
    <path d="M19 36c21-19 43-19 62 0M19 52c21 19 43 19 62 0m-42-40c-15 20-15 43 0 64m22-64c15 20 15 43 0 64" fill="none" stroke={GOLD_DARK} strokeWidth="2" />
    <path d="m50 34 10 8-4 12H44l-4-12Z" fill="#F4E6B9" />
    <path d="m41 77-3 26h24l-3-26" fill={GOLD_DARK} />
  </>,
  // Fictional competitions: original cups in the same visual family.
  liga: <>
    <path d="M29 31C10 23 14 63 36 64m35-33C90 23 86 63 64 64" fill="none" strokeWidth="5" />
    <path d="M27 23h46c-1 31-9 47-23 55-14-8-22-24-23-55Z" fill={GOLD} />
    <ellipse cx="50" cy="23" rx="23" ry="5" fill="#F0D88C" />
    <path d="m50 36 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2Z" fill="#F4ECD6" />
    <path d="m45 79-4 23h18l-4-23" fill={GOLD_DARK} />
  </>,
  carC: <>
    <path d="M28 26c-21-11-17 32 6 36m38-36c21-11 17 32-6 36" fill="none" strokeWidth="5" />
    <path d="M27 21h46L66 66 50 82 34 66Z" fill="#B77B43" />
    <ellipse cx="50" cy="21" rx="23" ry="5" fill="#D6AF79" />
    <path d="m41 38 9-6 9 6-3 16-6 4-6-4Zm4 44-4 21h18l-4-21" fill="#F2DAB1" />
  </>,
  copa8: <>
    <path d="m24 28 6-12h40l6 12-9 44-17 13-17-13Z" fill={GOLD} />
    <path d="M25 30 11 25l5 28 16 9m43-32 14-5-5 28-16 9" fill="#C2452F" />
    <circle cx="50" cy="43" r="9" fill="#F4ECD6" />
    <circle cx="50" cy="61" r="11" fill="#F4ECD6" />
    <circle cx="50" cy="43" r="3" fill={GOLD_DARK} />
    <circle cx="50" cy="61" r="4" fill={GOLD_DARK} />
    <path d="m45 85-5 18h20l-5-18" fill="#C2452F" />
  </>,
  relampago: <>
    <path d="M29 31C8 23 13 63 36 66m35-35C92 23 87 63 64 66" fill="none" strokeWidth="5" />
    <path d="M27 22h46c0 29-10 50-23 58-13-8-23-29-23-58Z" fill={SILVER} />
    <path d="m56 29-21 27h16l-7 21 24-33H53l10-15Z" fill={GOLD} />
    <path d="m45 82-4 21h18l-4-21" fill="#7C3AED" />
  </>,
  riosp: <>
    <path d="M29 35C12 24 12 64 34 64m37-29C88 24 88 64 66 64" fill="none" strokeWidth="5" />
    <path d="M30 25h40c0 26-6 43-20 54-14-11-20-28-20-54Z" fill={SILVER} />
    <path d="m39 42 6 7 16-9-7 20-15-3Z" fill={GOLD} />
    <path d="M44 80v23h12V80" fill={SILVER_DARK} />
  </>,
}

export function TrofeuPerfil({ comp, nome }: { comp: CompId; nome?: string }) {
  const art = illustrations[comp] ?? illustrations.liga
  return <svg className="social-trophy-illustration" viewBox="0 0 100 120" width={40} height={48} role="img" aria-label={nome ?? comp} data-art-style="perfil-v01">
    <g stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">{art}<rect x="28" y="105" width="44" height="10" rx="2.5" fill={INK} /><path d="M35 110h30" stroke={GOLD} strokeWidth="2" /></g>
  </svg>
}
