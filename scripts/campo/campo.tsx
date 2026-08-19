// ─── ⚽ CONFERÊNCIA DO CAMPINHO NOVO ─────────────────────────────────────────
// Renderiza o COMPONENTE DE VERDADE (`JogadorNoCampo`/`VagaNoCampo`), não uma
// cópia em HTML — é isso que garante que o mockup e o jogo batem.
//   npx vite --port 5199
//   → http://localhost:5199/7a0-game-studio/scripts/campo/
import { createRoot } from 'react-dom/client'
import { JogadorNoCampo, VagaNoCampo, BEGE_MANTO } from '../../src/escalacao/jogadorcampo'
import { mantoStripes } from '../../src/escalacao/manto'
import '../../src/index.css'

const INK = '#0C0C0C'
const MANTO = mantoStripes(['#181818', '#B89040'], 6, 90, null, false)
const XI = [
  { k: 'ATA', gente: [{ n: 'Neymar', c: 'Santos', y: 2011, g: 2 }, { n: 'Mbappé', c: 'PSG', y: 2022, g: 1 }, { n: 'Bebeto', c: 'Vasco', y: 1989 }] },
  { k: 'MEI', gente: [{ n: 'Lionel Messi', c: 'Barcelona', y: 2012, g: 3 }, { n: 'Ronaldinho Gaúcho', c: 'Barcelona', y: 2005 }, null] },
  { k: 'ZAG', gente: [{ n: 'Roberto Carlos', c: 'Real Madrid', y: 2002 }, { n: 'Lúcio', c: 'Inter', y: 2010 }, { n: 'Aldair', c: 'Roma', y: 1994 }, { n: 'Cafu', c: 'Milan', y: 2004 }] },
  { k: 'GOL', gente: [{ n: 'Taffarel', c: 'Internacional', y: 1989 }] },
]

const Campo = ({ manto, alt, fonte, listra }: { manto: string | null; alt: number; fonte: number; listra: number }) => (
  <div style={{ border: `3px solid ${INK}`, borderRadius: 16, overflow: 'hidden', boxShadow: `4px 4px 0 ${INK}`, marginBottom: 18 }}>
    <div style={{ padding: '16px 5px 18px', display: 'flex', flexDirection: 'column', gap: 14, background: `repeating-linear-gradient(180deg,#1B7A3D 0 ${listra}px,#166332 ${listra}px ${listra * 2}px)` }}>
      {XI.map(r => (
        <div key={r.k} style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 5, flexWrap: 'nowrap' }}>
          {r.gente.map((j, i) => j
            ? <JogadorNoCampo key={i} nome={j.n} clube={j.c} ano={j.y} tag={r.k} gols={j.g ?? 0} alt={alt} fonteNome={fonte} mantoCss={manto} />
            : <VagaNoCampo key={i} tag={r.k} alt={alt} />)}
        </div>
      ))}
    </div>
  </div>
)

createRoot(document.getElementById('r')!).render(
  <div style={{ maxWidth: 390, margin: '0 auto' }}>
    <p style={{ fontFamily: 'Oswald', fontWeight: 700, textTransform: 'uppercase', fontSize: 13, margin: '0 0 6px' }}>Elenco · com manto</p>
    <Campo manto={MANTO} alt={64} fonte={11} listra={44} />
    <p style={{ fontFamily: 'Oswald', fontWeight: 700, textTransform: 'uppercase', fontSize: 13, margin: '0 0 6px' }}>Leilão · sem manto (bege)</p>
    <Campo manto={BEGE_MANTO} alt={58} fonte={11} listra={38} />
  </div>
)
