// ⚡ MODO POKÉMON — a ARTE das cartas (25/10, só a conta do Diego, em teste).
// Regra dele: só as LENDAS têm o desenho do próprio pokémon (sem olhos, nariz e boca, igual às lendas do leilão);
// todo o RESTO usa o desenho do TIPO (o 1º tipo dele). Os 18 desenhos de tipo são nossos, em código (0 KB de arquivo).
// As Lendas são arquivos .webp separados (`img/pokemon/<nº>.webp`, ~23 KB cada): só descem pra quem vê a carta.
import type { CSSProperties } from 'react'
import { COR_TIPO, TIPO_EN, COM_ARTE, type Pokemon, type TipoPoke } from './pokemon-dados'
import { getLang } from './lang'

const ARTES = import.meta.glob('./img/pokemon/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export function arteDaLenda(n: number): string | undefined { return COM_ARTE.has(n) ? ARTES[`./img/pokemon/${n}.webp`] : undefined }

const K = '#1d140c'
const DESENHO: Record<TipoPoke, string> = {
  Normal: `<circle cx="50" cy="50" r="30" fill="#F4ECD6" stroke="${K}" stroke-width="6"/><circle cx="50" cy="50" r="12" fill="#C9BFA6" stroke="${K}" stroke-width="5"/>`,
  Fogo: `<path d="M50 12 C62 30 78 40 74 62 C71 80 60 88 50 88 C36 88 26 78 26 62 C26 48 36 44 38 30 C44 40 46 44 50 46 C52 34 50 22 50 12Z" fill="#FFB020" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><path d="M50 52 C58 60 62 66 60 74 C58 82 54 84 50 84 C44 84 40 80 40 73 C40 66 46 62 50 52Z" fill="#FFE14D" stroke="${K}" stroke-width="4"/>`,
  Água: `<path d="M50 12 C62 32 76 46 76 62 C76 78 64 88 50 88 C36 88 24 78 24 62 C24 46 38 32 50 12Z" fill="#7EC8FF" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><path d="M38 62 C38 70 42 76 48 78" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  Planta: `<path d="M20 80 C20 40 46 18 82 18 C82 54 60 80 20 80Z" fill="#7BD35A" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><path d="M24 76 C42 58 58 42 74 26" stroke="${K}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  Elétrico: `<path d="M58 10 L26 54 L46 54 L38 90 L74 42 L54 42 L62 10Z" fill="#FFE14D" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`,
  Gelo: `<g stroke="${K}" stroke-width="7" stroke-linecap="round"><path d="M50 14 V86 M19 32 L81 68 M19 68 L81 32"/></g><g stroke="#E8FBFF" stroke-width="3" stroke-linecap="round"><path d="M50 14 V86 M19 32 L81 68 M19 68 L81 32"/></g><circle cx="50" cy="50" r="9" fill="#E8FBFF" stroke="${K}" stroke-width="4"/>`,
  Lutador: `<rect x="22" y="28" width="56" height="46" rx="16" fill="#F2A65A" stroke="${K}" stroke-width="6"/><path d="M36 28 V46 M50 28 V46 M64 28 V46" stroke="${K}" stroke-width="4"/><rect x="30" y="72" width="40" height="14" rx="4" fill="#C2452F" stroke="${K}" stroke-width="5"/>`,
  Veneno: `<path d="M50 16 C62 34 74 46 74 60 C74 76 62 86 50 86 C38 86 26 76 26 60 C26 46 38 34 50 16Z" fill="#B57CFF" stroke="${K}" stroke-width="6"/><circle cx="44" cy="58" r="6" fill="#E9D8FF" stroke="${K}" stroke-width="3"/><circle cx="58" cy="70" r="4" fill="#E9D8FF" stroke="${K}" stroke-width="3"/><circle cx="70" cy="22" r="6" fill="#B57CFF" stroke="${K}" stroke-width="4"/>`,
  Terra: `<path d="M12 80 L38 34 L52 56 L64 40 L88 80Z" fill="#D9A15E" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><path d="M12 80 H88" stroke="${K}" stroke-width="6"/>`,
  Voador: `<path d="M18 70 C30 40 56 22 86 18 C78 30 74 36 66 40 C74 42 78 44 82 46 C70 54 60 56 50 56 C56 60 60 62 62 66 C46 72 32 72 18 70Z" fill="#E6EEFF" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`,
  Psíquico: `<path d="M50 50 C56 50 58 44 54 40 C48 34 38 40 38 50 C38 62 52 68 62 62 C74 54 72 36 60 28 C46 20 26 28 24 48 C22 66 38 80 56 78" fill="none" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M50 50 C56 50 58 44 54 40 C48 34 38 40 38 50 C38 62 52 68 62 62 C74 54 72 36 60 28 C46 20 26 28 24 48 C22 66 38 80 56 78" fill="none" stroke="#FFC2DA" stroke-width="4" stroke-linecap="round"/>`,
  Inseto: `<ellipse cx="50" cy="56" rx="22" ry="28" fill="#C2E06A" stroke="${K}" stroke-width="6"/><path d="M50 30 V84" stroke="${K}" stroke-width="4"/><path d="M42 30 C38 20 32 16 26 16 M58 30 C62 20 68 16 74 16" stroke="${K}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  Pedra: `<path d="M22 74 L28 40 L46 24 L70 30 L82 54 L74 78 Z" fill="#B89B74" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><path d="M46 24 L50 50 L82 54 M50 50 L36 76" stroke="${K}" stroke-width="4" fill="none"/>`,
  Fantasma: `<path d="M26 84 V46 C26 30 36 18 50 18 C64 18 74 30 74 46 V84 L66 76 L58 84 L50 76 L42 84 L34 76 Z" fill="#B7A6F0" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`,
  Dragão: `<path d="M20 78 C24 46 42 24 70 16 C64 28 62 36 64 44 C72 40 78 40 84 42 C74 50 70 58 70 68 C60 64 50 66 44 74 C38 70 30 72 20 78Z" fill="#7F92F0" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`,
  Sombrio: `<path d="M60 14 C40 18 26 34 26 52 C26 72 42 88 62 86 C48 78 40 66 40 52 C40 36 48 22 60 14Z" fill="#8A7E74" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>`,
  Aço: `<path d="M50 14 L80 31 V69 L50 86 L20 69 V31Z" fill="#D3DAE2" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="50" r="13" fill="#8C98A6" stroke="${K}" stroke-width="5"/>`,
  Fada: `<path d="M50 12 L58 40 L86 50 L58 60 L50 88 L42 60 L14 50 L42 40Z" fill="#FFD3EA" stroke="${K}" stroke-width="6" stroke-linejoin="round"/><circle cx="74" cy="22" r="5" fill="#FFD3EA" stroke="${K}" stroke-width="3"/>`,
}

export function TipoIcone({ tipo, size = 40 }: { tipo: TipoPoke; size?: number }) {
  return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" dangerouslySetInnerHTML={{ __html: DESENHO[tipo] }} />
}
export const nomeTipo = (t: TipoPoke) => (getLang() === 'en' ? TIPO_EN[t] : t)

/** os selos de tipo da carta (Fogo · Voador) */
export function ChipsTipo({ tipos, small = false, style }: { tipos: TipoPoke[]; small?: boolean; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, flexWrap: 'wrap', ...style }}>
      {tipos.map(t => (
        <span key={t} style={{ background: COR_TIPO[t], color: t === 'Elétrico' || t === 'Normal' || t === 'Fada' ? '#0C0C0C' : '#fff', border: '2px solid #0C0C0C', borderRadius: 7,
          fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: small ? 9 : 11, lineHeight: 1.25, padding: small ? '0 4px' : '0 6px', whiteSpace: 'nowrap' }}>{nomeTipo(t)}</span>
      ))}
    </span>
  )
}

/** o retrato do pokémon: Lenda = a arte dele; resto = o desenho do 1º tipo num quadrado na cor do tipo */
export function ArtePoke({ p, size = 66, redondo = true }: { p: Pokemon; size?: number; redondo?: boolean }) {
  const url = arteDaLenda(p.n)
  const t = p.tipos[0]
  if (url) return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <img src={url} alt={p.nome} draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,.25))' }} />
    </div>
  )
  return (
    <div style={{ width: size, height: size, borderRadius: redondo ? '50%' : 14, background: COR_TIPO[t], border: '3px solid #0C0C0C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
      <TipoIcone tipo={t} size={Math.round(size * 0.7)} />
    </div>
  )
}

/** 🔨 o "campinho" do leilão no modo Pokémon: as 6 vagas do time (5 lotes; o 5º vale 2) */
export function TimePokemon({ elenco, pokeDe }: { elenco: { id: string; name: string; pos: string }[]; pokeDe: (nome: string) => Pokemon | undefined }) {
  const en = getLang() === 'en'
  const vagas: [string, number][] = [['GOL', 1], ['LAT', 1], ['ZAG', 1], ['MEI', 1], ['ATA', 2]]
  const casas = vagas.flatMap(([pos, n], li) => Array.from({ length: n }, (_, k) => ({ pos, lote: li + 1, c: elenco.filter(c => c.pos === pos)[k] })))
  return (
    <div style={{ background: '#fff', border: '3px solid #0C0C0C', borderRadius: 16, padding: 10, boxShadow: '3px 3px 0 #0C0C0C' }}>
      <p style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 900, fontSize: 13, margin: '0 0 6px' }}>⚡ {en ? 'YOUR TEAM' : 'SEU TIME'} · {elenco.length}/6</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {casas.map(({ lote, c }, i) => {
          const p = c ? pokeDe(c.name) : undefined
          return (
            <div key={i} style={{ border: '2.5px solid #0C0C0C', borderRadius: 12, background: p ? '#FFF6CC' : '#F4ECD6', padding: '6px 4px', textAlign: 'center', minHeight: 86, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {p ? <><ArtePoke p={p} size={46} /><b style={{ fontFamily: 'Oswald, sans-serif', fontSize: 12, lineHeight: 1.1 }}>{p.nome}</b><ChipsTipo tipos={p.tipos} small /></>
                : <span style={{ fontFamily: 'Oswald, sans-serif', fontWeight: 700, fontSize: 12, color: 'rgba(12,12,12,.45)' }}>{en ? `Lot ${lote}` : `Lote ${lote}`}<br />{en ? 'empty' : 'vazio'}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
