// 🧱 O SELO DO CLUBE no Leilão de Clubes (estilo B escolhido pelo Diego, 28/09):
// círculo nas cores do clube, o NOME VERDADEIRO escrito em volta, o bicho/símbolo
// da torcida no meio e o ano de fundação embaixo. Desenhado aqui em SVG a partir da
// tabela `SELOS` (poucos bytes por clube — a arte desenhada do bicho é a etapa 2).
// Clube fora da tabela cai no escudo genérico de sempre.
import { useId } from 'react'
import { SELOS } from './selos-clubes'
import { clubCanon } from './data'
import { Escudo } from './escudos'

const INK = '#0C0C0C'
// texto claro ou escuro, conforme a cor do anel
const claro = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return (0.299 * r + 0.587 * g + 0.114 * b) > 170
}

export function seloDoClube(clube: string) {
  return SELOS[clubCanon(clube)] ?? SELOS[clube]
}

export function SeloClube({ clube, size = 40 }: { clube: string; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const s = seloDoClube(clube)
  if (!s) return <Escudo nome={clube} size={size} />
  const tinta = claro(s.c1) ? INK : '#FFFFFF'
  // o nome corre no arco de cima; nome comprido encolhe a letra pra caber
  // arco de 220° (r 37): ~142 de comprimento. Nome comprido que não caberia é
  // apertado pra caber inteiro (`textLength`), nunca cortado.
  const ARCO = 138
  const fs = Math.min(12.5, ARCO / (s.nome.length * 0.56))
  const aperta = s.nome.length * fs * 0.6 > ARCO
  const listras = Array.from({ length: 7 }, (_, i) => i)
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={s.nome} style={{ display: 'block', flex: 'none' }}>
      <defs>
        <path id={`arco-${uid}`} d="M 15.2 62.7 A 37 37 0 1 1 84.8 62.7" />
        <path id={`base-${uid}`} d="M 22 60 A 28 28 0 0 0 78 60" />
        <clipPath id={`miolo-${uid}`}><circle cx="50" cy="50" r="25" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="47" fill={s.c1} stroke={INK} strokeWidth="4" />
      <circle cx="50" cy="50" r="27" fill={INK} />
      <g clipPath={`url(#miolo-${uid})`}>
        <rect x="25" y="25" width="50" height="50" fill={s.c2} />
        {listras.map(i => i % 2 === 0 && <rect key={i} x={25 + i * (50 / 7)} y="25" width={50 / 7} height="50" fill={s.c1} opacity={0.55} />)}
      </g>
      <text fontFamily="Oswald, sans-serif" fontWeight={700} fontSize={fs} fill={tinta} letterSpacing="0.6" textAnchor="middle">
        <textPath href={`#arco-${uid}`} startOffset="50%" {...(aperta ? { textLength: ARCO, lengthAdjust: 'spacingAndGlyphs' } : {})}>{s.nome.toUpperCase()}</textPath>
      </text>
      <text x="50" y="59" fontSize="26" textAnchor="middle">{s.ic}</text>
      {s.ano && (
        <text fontFamily="Oswald, sans-serif" fontWeight={700} fontSize="8.5" fill={tinta} textAnchor="middle">
          <textPath href={`#base-${uid}`} startOffset="50%">{`★ ${s.ano} ★`}</textPath>
        </text>
      )}
    </svg>
  )
}
