// ─── 🎴 PRINT DA CARTA DE QUALQUER JOGADOR ───────────────────────────────────
// Pra post e vídeo: renderiza a carta REAL do jogo (o mesmo <CollectibleCard>
// que o jogador vê no álbum), com a bio de verdade do baralho — nada redesenhado.
//
// Nasceu do vídeo do Quincy Promes no TikTok (18/08): o Diego precisava da carta
// dele pra fechar o vídeo, e o leilão sorteia um punhado de cartas por partida,
// então esperar o jogador aparecer no pregão não dá.
//
// ── COMO USAR ───────────────────────────────────────────────────────────────
//   npx vite --port 5199
//   → http://localhost:5199/7a0-game-studio/scripts/carta/?nome=Quincy%20Promes
//   e tira o print do elemento (ou use scripts/carta/print.mjs).
//
// Acha o jogador nos TRÊS baralhos (BR, Europa, Mundo) e em qualquer posição.
import { createRoot } from 'react-dom/client'
import { CollectibleCard } from '../../src/escalacao/screens'
import { CATALOG, CATALOG_EU, CATALOG_WORLD } from '../../src/escalacao/data'
import '../../src/index.css'

type Ficha = { name: string; club: string; year: number; fame: number; bio?: string; folk?: boolean; promessa?: boolean }
const POSES = ['GOL', 'LAT', 'ZAG', 'MEI', 'ATA'] as const
const nome = new URLSearchParams(location.search).get('nome') ?? 'Quincy Promes'
const grande = new URLSearchParams(location.search).get('big') === '1'

let achado: { f: Ficha; pos: string } | null = null
for (const cat of [CATALOG, CATALOG_EU, CATALOG_WORLD] as Record<string, Ficha[]>[]) {
  for (const pos of POSES) {
    const f = (cat[pos] ?? []).find(x => x.name.toLowerCase() === nome.toLowerCase())
    if (f && !achado) achado = { f, pos }
  }
}

createRoot(document.getElementById('r')!).render(
  achado ? (
    <div style={{ background: '#F4ECD6', padding: 26, display: 'inline-flex' }}>
      <CollectibleCard name={achado.f.name} club={achado.f.club} year={achado.f.year}
        pos={achado.pos} fame={achado.f.fame} bio={achado.f.bio}
        folk={achado.f.folk} promessa={achado.f.promessa} big={grande} showBio />
    </div>
  ) : (
    <p style={{ fontFamily: 'system-ui', fontWeight: 800, padding: 40 }}>
      Não achei “{nome}” em nenhum dos três baralhos. Confira o nome exato em <code>data.ts</code>.
    </p>
  ),
)
